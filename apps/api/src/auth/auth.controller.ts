import { Body, Controller, Get, Patch } from "@nestjs/common";
import { User } from "@prisma/client";
import { updateProfileSchema } from "@courte/shared";
import { CurrentUser } from "../common/current-user.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { PrismaService } from "../prisma/prisma.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("me")
  async me(@CurrentUser() user: User) {
    const memberships = await this.prisma.venueMember.findMany({
      where: { userId: user.id },
      include: {
        venue: {
          select: { id: true, name: true, slug: true, city: true, isActive: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return this.serialize(user, memberships);
  }

  @Patch("me")
  async update(
    @CurrentUser() user: User,
    @Body(new ZodPipe(updateProfileSchema)) body: ReturnType<typeof updateProfileSchema.parse>,
  ) {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: body.fullName,
        phone: body.phone,
        whatsapp: body.whatsapp,
      },
    });
    return this.me(updated);
  }

  private async serialize(
    user: User,
    memberships?: {
      role: string;
      venue: { id: string; name: string; slug: string; city: string; isActive: boolean };
    }[],
  ) {
    const items =
      memberships ??
      (await this.prisma.venueMember.findMany({
        where: { userId: user.id },
        include: {
          venue: {
            select: { id: true, name: true, slug: true, city: true, isActive: true },
          },
        },
        orderBy: { createdAt: "asc" },
      }));

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      whatsapp: user.whatsapp,
      accountKind: user.accountKind,
      platformRole: user.platformRole,
      venues: items.map((membership) => ({
        id: membership.venue.id,
        name: membership.venue.name,
        slug: membership.venue.slug,
        city: membership.venue.city,
        isActive: membership.venue.isActive,
        role: membership.role,
      })),
    };
  }
}
