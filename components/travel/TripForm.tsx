"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { ImageUploader } from "@/components/form/ImageUploader";
import {
  TicketDatePicker,
  TicketField,
  TicketInput,
  TicketSelect,
} from "@/components/travel/ticket-controls";
import { FmnButton } from "@/components/ui/fmn-button";
import { FmnPaperCard } from "@/components/ui/fmn-paper-card";
import { createClient } from "@/lib/supabase/client";
import { fetchItemsByTripId } from "@/lib/items/queries";
import { createTrip, updateTrip } from "@/lib/trips/mutations";
import type { TravelStatus, TripWithStats, Visibility } from "@/lib/trips/types";
import {
  assertTripDatesCoverItems,
  isTripDateRangeValid,
  isTripDestinationFilled,
  normalizeTripDestination,
} from "@/lib/trips/validation";
import { countPublicItems } from "@/lib/trips/visibility";
import { uploadUserImage } from "@/lib/storage/upload";

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type TripFormProps = {
  mode: "create" | "edit";
  trip?: TripWithStats;
  userId: string;
};

const TRAVEL_STATUS_OPTIONS = [
  { value: "upcoming", label: "即将出行" },
  { value: "active", label: "进行中" },
  { value: "ended", label: "已结束" },
];

const VISIBILITY_OPTIONS = [
  { value: "private", label: "私密" },
  { value: "public", label: "公开" },
];

export function TripForm({ mode, trip, userId }: TripFormProps) {
  const router = useRouter();
  const cancelHref = mode === "edit" && trip ? `/trips/${trip.id}` : "/home";
  const successBase = mode === "edit" && trip ? `/trips/${trip.id}` : null;

  const [name, setName] = useState(trip?.name ?? "");
  const [destination, setDestination] = useState(trip?.destination ?? "");
  const [startDate, setStartDate] = useState(trip?.startDate ?? todayIso());
  const [endDate, setEndDate] = useState(trip?.endDate ?? todayIso());
  const [visibility, setVisibility] = useState<Visibility>(
    trip?.visibility ?? "private",
  );
  const [travelStatus, setTravelStatus] = useState<TravelStatus>(
    trip?.travelStatus ?? "upcoming",
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(
    trip?.mainImageUrl ?? null,
  );
  const [existingImagePath, setExistingImagePath] = useState<string | null>(
    trip?.mainImagePath ?? null,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPublicCount, setPendingPublicCount] = useState(0);

  function validateBasic(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "请填写旅行名称";
    // New Trip: Destination required. Historical edit: NULL allowed (no force-fill).
    if (mode === "create" && !isTripDestinationFilled(destination)) {
      next.destination = "请填写目的地";
    }
    if (!startDate) next.startDate = "请选择开始日期";
    if (!endDate) next.endDate = "请选择结束日期";
    if (startDate && endDate && !isTripDateRangeValid(startDate, endDate)) {
      next.endDate = "结束日期不能早于开始日期";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function resolveImagePath(
    supabase: ReturnType<typeof createClient>,
  ): Promise<string | null> {
    if (imageFile) {
      return uploadUserImage({
        supabase,
        userId,
        bucket: "trip-images",
        file: imageFile,
      });
    }
    return existingImagePath;
  }

  async function performSave(options?: { skipPrivatizeConfirm?: boolean }) {
    setSubmitError(null);
    if (!validateBasic()) return;

    const supabase = createClient();
    setSaving(true);
    try {
      if (mode === "edit" && trip) {
        const items = await fetchItemsByTripId(supabase, trip.id);
        const cover = assertTripDatesCoverItems(
          startDate,
          endDate,
          items.map((item) => item.purchaseDate),
        );
        if (!cover.ok) {
          setErrors((prev) => ({ ...prev, endDate: cover.message }));
          setSubmitError(cover.message);
          setSaving(false);
          return;
        }

        const makingPrivate =
          visibility === "private" && trip.visibility === "public";
        const publicCount = countPublicItems(items);

        if (makingPrivate && publicCount > 0 && !options?.skipPrivatizeConfirm) {
          setPendingPublicCount(publicCount);
          setConfirmOpen(true);
          setSaving(false);
          return;
        }

        if (makingPrivate && publicCount > 0) {
          const { error: itemsError } = await supabase
            .from("items")
            .update({ visibility: "private" })
            .eq("trip_id", trip.id)
            .eq("visibility", "public");
          if (itemsError) {
            throw new Error(itemsError.message);
          }
        }

        const mainImagePath = await resolveImagePath(supabase);
        await updateTrip(supabase, {
          tripId: trip.id,
          name: name.trim(),
          startDate,
          endDate,
          destination: normalizeTripDestination(destination),
          mainImagePath,
          visibility,
          travelStatus,
        });
        router.push(successBase!);
      } else {
        const mainImagePath = await resolveImagePath(supabase);
        const created = await createTrip(supabase, {
          userId,
          name: name.trim(),
          startDate,
          endDate,
          destination: destination.trim(),
          mainImagePath,
          visibility,
          travelStatus,
        });
        router.push(`/trips/${created.id}`);
      }
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "保存失败，请重试");
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await performSave();
  }

  return (
    <>
      <FmnPaperCard className="mx-auto max-w-xl p-5 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <TicketField
          label="旅行名称"
          htmlFor="trip-name"
          required
          error={errors.name}
        >
          <TicketInput
            id="trip-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            hasError={Boolean(errors.name)}
            placeholder="例如：Bangkok Shopping Trip"
            disabled={saving}
          />
        </TicketField>

        <TicketField
          label="目的地"
          htmlFor="trip-destination"
          required={mode === "create"}
          hint={
            mode === "edit"
              ? "历史旅行可留空；不强制补齐"
              : undefined
          }
          error={errors.destination}
        >
          <TicketInput
            id="trip-destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            hasError={Boolean(errors.destination)}
            placeholder="例如：东京、Bangkok"
            autoComplete="off"
            disabled={saving}
          />
        </TicketField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TicketField
            label="开始日期"
            htmlFor="trip-start"
            required
            error={errors.startDate}
          >
            <TicketDatePicker
              id="trip-start"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              hasError={Boolean(errors.startDate)}
              disabled={saving}
            />
          </TicketField>
          <TicketField
            label="结束日期"
            htmlFor="trip-end"
            required
            error={errors.endDate}
          >
            <TicketDatePicker
              id="trip-end"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              hasError={Boolean(errors.endDate)}
              disabled={saving}
            />
          </TicketField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TicketField label="公开 / 私密" htmlFor="trip-visibility" required>
            <TicketSelect
              id="trip-visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as Visibility)}
              options={VISIBILITY_OPTIONS}
              disabled={saving}
            />
          </TicketField>
          <TicketField label="旅行状态" htmlFor="trip-status" required>
            <TicketSelect
              id="trip-status"
              value={travelStatus}
              onChange={(e) => setTravelStatus(e.target.value as TravelStatus)}
              options={TRAVEL_STATUS_OPTIONS}
              disabled={saving}
            />
          </TicketField>
        </div>

        <TicketField label="旅行主图" hint="可选，最多 1 张" error={errors.image}>
          <ImageUploader
            variant="TripCoverImage"
            value={imageFile}
            existingUrl={existingImageUrl}
            onChange={(file) => {
              setImageFile(file);
              if (file) setExistingImageUrl(null);
            }}
            onClearExisting={() => {
              setExistingImageUrl(null);
              setExistingImagePath(null);
            }}
            disabled={saving}
          />
        </TicketField>

        {submitError ? (
          <p className="border border-dashed border-red-600/50 px-3 py-2 font-mono text-[0.75rem] tracking-wide text-red-700">
            {submitError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <FmnButton
            type="button"
            variant="ticket"
            disabled={saving}
            onClick={() => router.push(cancelHref)}
          >
            取消
          </FmnButton>
          <FmnButton type="submit" variant="stamp" disabled={saving}>
            {saving ? "保存中…" : "保存"}
          </FmnButton>
        </div>
      </form>
      </FmnPaperCard>

      <ConfirmDialog
        open={confirmOpen}
        title="将旅行设为私密？"
        description={
          <>
            该旅行中有 {pendingPublicCount}{" "}
            个公开商品。确认后，这些公开商品将一并设为私密。此操作不会自动在日后改回公开。
          </>
        }
        confirmLabel="确认设为私密"
        cancelLabel="取消"
        confirming={saving}
        onCancel={() => {
          if (!saving) setConfirmOpen(false);
        }}
        onConfirm={async () => {
          setConfirmOpen(false);
          await performSave({ skipPrivatizeConfirm: true });
        }}
      />
    </>
  );
}
