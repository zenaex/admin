import Image from "next/image";
import Link from "next/link";

import { TxDataBlockTable, LINK, TEXT } from "@/components/transactions/transaction-details/tx-data-block-table";
import type {
  GiftcardDetailModel,
  GiftcardTransactionDetailsProps,
  TxApprovalStatus,
} from "@/components/transactions/transaction-details/types";

function GiftcardImagePlaceholder() {
  return (
    <div
      className="flex min-h-[220px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100/80 px-4 py-10 text-center"
      role="img"
      aria-label="No card image available"
    >
      <div className="h-12 w-16 rounded-md border border-zinc-300 bg-zinc-200/80" aria-hidden />
      <span className="text-xs font-medium text-zinc-500">No card image uploaded</span>
    </div>
  );
}

function GiftcardPhysicalImage({ imageUrl }: { imageUrl?: string }) {
  const src = imageUrl?.trim();
  if (!src) return <GiftcardImagePlaceholder />;

  return (
    <div className="relative min-h-[220px] w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
      <Image
        src={src}
        alt="Physical gift card"
        fill
        className="object-contain p-2"
        sizes="(max-width: 768px) 100vw, 640px"
        unoptimized
      />
    </div>
  );
}

function RejectionAttachmentPreview({ code, message }: { code: string; message?: string }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="flex min-h-[220px] items-center justify-center bg-zinc-100/80">
        <div className="h-12 w-16 rounded-md border border-zinc-300 bg-zinc-200/80" aria-hidden />
      </div>
      <div className="space-y-2 px-4 py-4">
        {code ? (
          <div className="flex items-center gap-2 text-sm text-zinc-700">
            <span className="font-semibold text-zinc-500">Code:</span>
            <span className="font-semibold text-primary-text">{code}</span>
          </div>
        ) : null}
        {message ? <p className="text-sm font-semibold text-red-600">{message}</p> : null}
      </div>
    </div>
  );
}

function SessionIdLink({ id }: { id: string }) {
  return (
    <Link
      href="#"
      className="underline underline-offset-2 hover:opacity-80"
      style={{ color: LINK }}
      onClick={(e) => e.preventDefault()}
    >
      {id}
    </Link>
  );
}

function splitTimestamp(value: string) {
  const parts = value.split(" | ");
  return (
    <span className="text-sm" style={{ color: TEXT }}>
      <span style={{ color: LINK }}>{parts[0]}</span>
      {parts.length > 1 ? ` | ${parts.slice(1).join(" | ")}` : ""}
    </span>
  );
}

function countryCell(country: string) {
  const countryParts = country.split(" | ");
  const countryLeft = countryParts[0] ?? "";
  const countryRest = countryParts.length > 1 ? ` | ${countryParts.slice(1).join(" | ")}` : "";
  return (
    <span key="co" className="text-sm" style={{ color: TEXT }}>
      <span style={{ color: LINK }}>{countryLeft}</span>
      {countryRest}
    </span>
  );
}

function row2LastColumn(approvalStatus: TxApprovalStatus, model: GiftcardDetailModel) {
  if (approvalStatus === "Rejected") {
    return model.opsInCharge;
  }
  return model.provider;
}

function row2LastHeader(approvalStatus: TxApprovalStatus) {
  if (approvalStatus === "Rejected") {
    return "Ops in charge";
  }
  return "Provider";
}

function CodeCell({
  codeDisplay,
  canRevealECode,
  onRevealECode,
  eCodeLoading,
  eCodeError,
}: {
  codeDisplay: string;
  canRevealECode?: boolean;
  onRevealECode?: () => void;
  eCodeLoading?: boolean;
  eCodeError?: string | null;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold" style={{ color: TEXT }}>
        {codeDisplay || "—"}
      </span>
      {canRevealECode && onRevealECode ? (
        <button
          type="button"
          onClick={onRevealECode}
          disabled={eCodeLoading}
          className="w-fit text-left text-xs font-semibold text-primary-green underline underline-offset-2 hover:opacity-80 disabled:opacity-50"
        >
          {eCodeLoading ? "Loading…" : "Reveal e-code"}
        </button>
      ) : null}
      {eCodeError ? <span className="text-xs font-medium text-red-600">{eCodeError}</span> : null}
    </div>
  );
}

export function GiftcardTransactionDetails({
  approvalStatus,
  model,
  device,
  rejectionMessage,
  codeDisplay,
  canRevealECode,
  onRevealECode,
  eCodeLoading,
  eCodeError,
}: GiftcardTransactionDetailsProps) {
  const showRejectionAttachment = approvalStatus === "Rejected";
  const attachmentCode = codeDisplay || model.code;
  const isPhysical = model.cardFormat === "physical";
  const isECode = model.cardFormat === "e-code";
  const showRevealECode = isECode && canRevealECode;

  return (
    <>
      <section className="mt-6">
        <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
          Transaction Details
        </h2>
        <TxDataBlockTable
          headers={["Session ID", "Customer Names", "Channel", "Type", "Code", "Country"]}
          row={[
            <SessionIdLink key="tid" id={model.sessionId} />,
            model.customerName,
            "Gift Card",
            model.cardFormat === "e-code" ? "Ecode" : "Physical",
            <CodeCell
              key="code"
              codeDisplay={isPhysical && !codeDisplay ? "—" : codeDisplay}
              canRevealECode={showRevealECode}
              onRevealECode={onRevealECode}
              eCodeLoading={eCodeLoading}
              eCodeError={eCodeError}
            />,
            countryCell(model.country),
          ]}
        />
        <TxDataBlockTable
          className="mt-6"
          headers={[
            "Amount",
            "Amount Paid out",
            "Date Uploaded",
            "Date Completed",
            "Rate / Fee Given",
            row2LastHeader(approvalStatus),
          ]}
          row={[
            model.amount,
            model.amountPaidOut,
            splitTimestamp(model.dateUploaded),
            splitTimestamp(model.dateCompleted),
            model.rateFeeGiven,
            row2LastColumn(approvalStatus, model),
          ]}
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
          Device Information
        </h2>
        <TxDataBlockTable
          headers={["Device", "Device ID", "Location", "Location Coordinate"]}
          row={[device.device, device.deviceId, device.location, device.locationCoordinate]}
        />
      </section>

      {showRejectionAttachment ? (
        <section className="mt-8">
          <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
            Rejection Attachment
          </h2>
          <RejectionAttachmentPreview code={attachmentCode} message={rejectionMessage} />
        </section>
      ) : null}

      {isPhysical ? (
        <section className="mt-8">
          <h2 className="mb-4 text-base font-semibold" style={{ color: TEXT }}>
            Physical Card Image
          </h2>
          <GiftcardPhysicalImage imageUrl={model.physicalImageUrl} />
        </section>
      ) : null}
    </>
  );
}
