import { COURT_SETTINGS, COURT_SIZES, COURT_SURFACES } from "@courte/shared";

const FORM_KEY = "courte.onboarding.form.v1";

export const ONBOARDING_STEPS = [
  { id: "venue", href: "/onboarding", title: "الملعب", hint: "الاسم والتواصل" },
  { id: "place", href: "/onboarding/place", title: "الموقع والصور", hint: "الخريطة والمعرض" },
  { id: "court", href: "/onboarding/court", title: "المواصفات", hint: "الحجم ومدة الحجز" },
  { id: "review", href: "/onboarding/review", title: "المراجعة", hint: "الأسعار ثم النشر" },
] as const;

export type OnboardingForm = {
  name: string;
  nameEn: string;
  city: string;
  address: string;
  addressEn: string;
  phone: string;
  whatsapp: string;
  description: string;
  descriptionEn: string;
  latitude: number | null;
  longitude: number | null;
  venueTypeIds: string[];
  acceptsOnlineBooking: boolean;
  amenityIds: string[];
  resourceName: string;
  resourceNameEn: string;
  duration: number;
  size: (typeof COURT_SIZES)[number];
  surface: (typeof COURT_SURFACES)[number];
  setting: (typeof COURT_SETTINGS)[number];
  hasLights: boolean;
  dayPrice: number;
  eveningPrice: number;
  weekendPrice: number;
};

export const defaultOnboardingForm = (): OnboardingForm => ({
  name: "",
  nameEn: "",
  city: "Ramallah",
  address: "",
  addressEn: "",
  phone: "",
  whatsapp: "",
  description: "",
  descriptionEn: "",
  latitude: null,
  longitude: null,
  venueTypeIds: [],
  acceptsOnlineBooking: true,
  amenityIds: [],
  resourceName: "ملعب 1",
  resourceNameEn: "Court 1",
  duration: 60,
  size: "FIVE_V_FIVE",
  surface: "ARTIFICIAL_GRASS",
  setting: "OUTDOOR",
  hasLights: true,
  dayPrice: 50,
  eveningPrice: 70,
  weekendPrice: 80,
});

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function stepIndexFromPath(pathname: string) {
  const normalized = pathname.replace(/\/$/, "") || "/onboarding";
  const index = ONBOARDING_STEPS.findIndex((step) => step.href === normalized);
  return index < 0 ? 0 : index;
}

export function loadOnboardingForm(): OnboardingForm {
  const fallback = defaultOnboardingForm();
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(FORM_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<OnboardingForm> & { venueTypeId?: string };
    const venueTypeIds =
      parsed.venueTypeIds?.length
        ? parsed.venueTypeIds
        : parsed.venueTypeId
          ? [parsed.venueTypeId]
          : fallback.venueTypeIds;
    return { ...fallback, ...parsed, venueTypeIds };
  } catch {
    return fallback;
  }
}

export function saveOnboardingForm(form: OnboardingForm) {
  window.localStorage.setItem(FORM_KEY, JSON.stringify(form));
}

export function clearOnboardingForm() {
  window.localStorage.removeItem(FORM_KEY);
  void clearOnboardingPhotos();
}

const PHOTO_DB = "courte-onboarding";
const PHOTO_STORE = "files";
const PHOTO_KEY = "photos";

type StoredPhotos = {
  coverId: string | null;
  photos: { id: string; name: string; type: string; file: Blob }[];
};

function openPhotoDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(PHOTO_DB, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(PHOTO_STORE)) {
        request.result.createObjectStore(PHOTO_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txDone(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function saveOnboardingPhotos(
  photos: { id: string; file: File }[],
  coverId: string | null,
) {
  if (typeof window === "undefined") return;
  const db = await openPhotoDb();
  const tx = db.transaction(PHOTO_STORE, "readwrite");
  tx.objectStore(PHOTO_STORE).put(
    {
      coverId,
      photos: photos.map((photo) => ({
        id: photo.id,
        name: photo.file.name,
        type: photo.file.type,
        file: photo.file,
      })),
    } satisfies StoredPhotos,
    PHOTO_KEY,
  );
  await txDone(tx);
  db.close();
}

export async function loadOnboardingPhotos() {
  if (typeof window === "undefined") return null;
  const db = await openPhotoDb();
  const tx = db.transaction(PHOTO_STORE, "readonly");
  const request = tx.objectStore(PHOTO_STORE).get(PHOTO_KEY);
  const value = await new Promise<StoredPhotos | undefined>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as StoredPhotos | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  if (!value?.photos?.length) return null;
  return {
    coverId: value.coverId,
    photos: value.photos.map((photo) => ({
      id: photo.id,
      file: new File([photo.file], photo.name || "photo.jpg", { type: photo.type || "image/jpeg" }),
    })),
  };
}

export async function clearOnboardingPhotos() {
  if (typeof window === "undefined") return;
  const db = await openPhotoDb();
  const tx = db.transaction(PHOTO_STORE, "readwrite");
  tx.objectStore(PHOTO_STORE).delete(PHOTO_KEY);
  await txDone(tx);
  db.close();
}
