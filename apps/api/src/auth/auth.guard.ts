import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { User } from "@prisma/client";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Request } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { IS_PUBLIC_KEY } from "../common/public.decorator";
import { PrismaService } from "../prisma/prisma.service";

type SupabaseJwt = {
  sub: string;
  email?: string;
  phone?: string;
  exp?: number;
  user_metadata?: { full_name?: string; name?: string; account_kind?: string; phone?: string };
};

type Cached<T> = { value: T; expiresAt: number };

const VERIFY_CACHE_MS = 5 * 60_000;

@Injectable()
export class AuthGuard implements CanActivate {
  private supabase: SupabaseClient | null = null;
  private readonly verifiedTokens = new Map<string, Cached<SupabaseJwt>>();
  private readonly inflightVerify = new Map<string, Promise<SupabaseJwt>>();
  private readonly inflightUsers = new Map<string, Promise<User>>();

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      throw new UnauthorizedException("Missing access token");
    }

    const payload = await this.verifyAccessToken(token);
    if (!payload.sub) {
      throw new UnauthorizedException("Invalid session");
    }

    const user = await this.resolveUser(payload);
    (request as Request & { user: User }).user = user;
    return true;
  }

  private async verifyAccessToken(token: string): Promise<SupabaseJwt> {
    const cached = this.verifiedTokens.get(token);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const pending = this.inflightVerify.get(token);
    if (pending) return pending;

    const task = this.verifyAccessTokenUncached(token)
      .then((payload) => {
        const ttl = this.cacheTtlMs(payload.exp);
        this.verifiedTokens.set(token, { value: payload, expiresAt: Date.now() + ttl });
        this.prune(this.verifiedTokens);
        return payload;
      })
      .finally(() => {
        this.inflightVerify.delete(token);
      });

    this.inflightVerify.set(token, task);
    return task;
  }

  private async verifyAccessTokenUncached(token: string): Promise<SupabaseJwt> {
    const secret = this.config.get<string>("SUPABASE_JWT_SECRET");
    if (secret && secret !== "your-jwt-secret") {
      return this.verifyLocally(token, secret);
    }
    return this.verifyWithSupabase(token);
  }

  private verifyLocally(token: string, secret: string): SupabaseJwt {
    let decoded: string | JwtPayload;
    try {
      decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
    } catch {
      throw new UnauthorizedException("Invalid or expired session");
    }
    if (typeof decoded === "string" || !decoded.sub) {
      throw new UnauthorizedException("Invalid session");
    }
    const role = typeof decoded.role === "string" ? decoded.role : undefined;
    const audience = Array.isArray(decoded.aud) ? decoded.aud[0] : decoded.aud;
    if (role && role !== "authenticated") {
      throw new UnauthorizedException("Invalid session");
    }
    if (audience && audience !== "authenticated") {
      throw new UnauthorizedException("Invalid session");
    }

    const metadata =
      decoded.user_metadata && typeof decoded.user_metadata === "object"
        ? (decoded.user_metadata as SupabaseJwt["user_metadata"])
        : undefined;

    return {
      sub: decoded.sub,
      email: typeof decoded.email === "string" ? decoded.email : undefined,
      phone: typeof decoded.phone === "string" ? decoded.phone : undefined,
      exp: typeof decoded.exp === "number" ? decoded.exp : undefined,
      user_metadata: metadata,
    };
  }

  private async verifyWithSupabase(token: string): Promise<SupabaseJwt> {
    const { data, error } = await this.getSupabase().auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException("Invalid or expired session");
    }

    const decoded = jwt.decode(token);
    const exp =
      decoded && typeof decoded === "object" && typeof decoded.exp === "number"
        ? decoded.exp
        : undefined;

    return {
      sub: data.user.id,
      email: data.user.email,
      phone: data.user.phone,
      exp,
      user_metadata: data.user.user_metadata,
    };
  }

  private getSupabase() {
    if (this.supabase) return this.supabase;
    const url =
      this.config.get<string>("SUPABASE_URL") ?? this.config.get<string>("NEXT_PUBLIC_SUPABASE_URL");
    const key =
      this.config.get<string>("SUPABASE_ANON_KEY") ??
      this.config.get<string>("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    if (!url || !key) {
      throw new UnauthorizedException("Auth is not configured");
    }
    this.supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return this.supabase;
  }

  private async resolveUser(payload: SupabaseJwt): Promise<User> {
    const pending = this.inflightUsers.get(payload.sub);
    if (pending) return pending;

    const task = this.loadUser(payload).finally(() => {
      this.inflightUsers.delete(payload.sub);
    });
    this.inflightUsers.set(payload.sub, task);
    return task;
  }

  private async loadUser(payload: SupabaseJwt) {
    const email = payload.email ?? `${payload.sub}@users.courte.local`;
    const fullName =
      payload.user_metadata?.full_name ??
      payload.user_metadata?.name ??
      email.split("@")[0];
    const phone = payload.phone || payload.user_metadata?.phone || null;
    const accountKind =
      payload.user_metadata?.account_kind === "OWNER" ? "OWNER" : "CUSTOMER";

    const existing = await this.prisma.user.findUnique({
      where: { supabaseAuthId: payload.sub },
    });
    if (!existing) {
      return this.prisma.user.create({
        data: {
          supabaseAuthId: payload.sub,
          email,
          fullName,
          phone,
          accountKind,
        },
      });
    }

    const nextPhone = phone ?? existing.phone;
    if (existing.email === email && existing.fullName === fullName && existing.phone === nextPhone) {
      return existing;
    }

    return this.prisma.user.update({
      where: { id: existing.id },
      data: {
        email,
        fullName,
        phone: nextPhone,
      },
    });
  }

  private cacheTtlMs(exp?: number) {
    if (exp) {
      return Math.max(1_000, Math.min(VERIFY_CACHE_MS, exp * 1000 - Date.now() - 5_000));
    }
    return VERIFY_CACHE_MS;
  }

  private prune<T>(cache: Map<string, Cached<T>>) {
    if (cache.size < 200) return;
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (entry.expiresAt <= now) cache.delete(key);
    }
  }
}
