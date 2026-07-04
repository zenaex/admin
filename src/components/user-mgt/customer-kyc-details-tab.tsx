"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { getAdminCustomerKyc } from "@/lib/admin-api/customers-api";
import { AdminApiError } from "@/lib/admin-api/client";
import type { AdminCustomerKycDetails } from "@/lib/admin-api/types";
import { ErrorAlert } from "@/components/ui/error-alert";

type CustomerKycDetailsTabProps = {
  accountId: string;
  customerDisplayName?: string;
};

function kycCell(value: string | undefined): string {
  const t = value?.trim();
  return t ? t : "-";
}

function KycStatusBadge({ status }: { status: string }) {
  const label = kycCell(status);
  if (label === "-") return <span className="text-sm text-zinc-500">-</span>;

  const key = label.toLowerCase();
  let cls = "bg-zinc-100 text-zinc-600";
  let dot = "bg-zinc-400";
  if (key.includes("approv") || key.includes("verified") || key.includes("complete")) {
    cls = "bg-green-50 text-green-700";
    dot = "bg-green-600";
  } else if (key.includes("pend") || key.includes("review") || key.includes("submitted")) {
    cls = "bg-orange-50 text-orange-600";
    dot = "bg-orange-500";
  } else if (key.includes("reject") || key.includes("fail") || key.includes("declin")) {
    cls = "bg-red-50 text-red-600";
    dot = "bg-red-500";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${cls}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}

function KycTierTable({
  title,
  headers,
  cells,
}: {
  title: string;
  headers: string[];
  cells: ReactNode[];
}) {
  return (
    <section>
      <h2 className="text-[18px] font-semibold text-primary-text">{title}</h2>
      <div className="mt-4 overflow-x-auto rounded-xl border border-outline bg-white">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="bg-zinc-50 text-xs text-zinc-400">
              {headers.map((h) => (
                <th key={h} className="h-11 border-b border-zinc-200 px-4 py-0 font-medium align-middle">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {cells.map((cell, i) => (
                <td
                  key={headers[i]}
                  className={`h-16 border-b border-zinc-100 px-4 py-0 align-middle ${
                    i < cells.length - 1 ? "text-primary-text" : ""
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function CustomerKycDetailsTab({ accountId, customerDisplayName }: CustomerKycDetailsTabProps) {
  const [kyc, setKyc] = useState<AdminCustomerKycDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const details = await getAdminCustomerKyc(accountId, {
        fallbackName: customerDisplayName,
      });
      setKyc(details);
    } catch (e) {
      setKyc(null);
      setError(e instanceof AdminApiError ? e.message : "Could not load KYC.");
    } finally {
      setLoading(false);
    }
  }, [accountId, customerDisplayName]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="mt-6 text-sm text-zinc-500">Loading KYC details…</p>;
  }

  if (error) {
    return <ErrorAlert error={error} onRetry={() => void load()} className="mt-6" />;
  }

  const tier1 = kyc?.tier1 ?? {
    name: "",
    bvn: "",
    dateOfBirth: "",
    status: "",
    gender: "",
    submittedAt: "",
    provider: "",
    errorMessage: "",
  };
  const tier2 = kyc?.tier2 ?? {
    name: "",
    idType: "",
    idNumber: "",
    dateIssued: "",
    dateOfExpiry: "",
    status: "",
    dateOfBirth: "",
    gender: "",
    submittedAt: "",
    provider: "",
    errorMessage: "",
  };

  return (
    <div className="mt-6 space-y-8">
      <div>
        <KycTierTable
          title="Tier 1 Details"
          headers={["Name", "BVN", "Date of Birth", "Gender", "Provider", "Submitted At", "Status"]}
          cells={[
            <span key="name" className="font-medium text-primary-text">
              {kycCell(tier1.name)}
            </span>,
            <span key="bvn" className="text-zinc-600">
              {kycCell(tier1.bvn)}
            </span>,
            <span key="dob" className="whitespace-nowrap text-zinc-600">
              {kycCell(tier1.dateOfBirth)}
            </span>,
            <span key="gender" className="whitespace-nowrap text-zinc-600 capitalize">
              {kycCell(tier1.gender?.toLowerCase() || "")}
            </span>,
            <span key="provider" className="whitespace-nowrap text-zinc-600 capitalize">
              {kycCell(tier1.provider)}
            </span>,
            <span key="submitted" className="whitespace-nowrap text-zinc-600">
              {kycCell(tier1.submittedAt)}
            </span>,
            <KycStatusBadge key="status" status={tier1.status} />,
          ]}
        />
        {tier1.errorMessage && (
          <div className="mt-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            <strong>Verification Error:</strong> {tier1.errorMessage}
          </div>
        )}
      </div>

      <div>
        <KycTierTable
          title="Tier 2 Details"
          headers={[
            "Name",
            "ID Type",
            "ID Number",
            "Date of Birth",
            "Gender",
            "Date Issued",
            "Date of Expiry",
            "Provider",
            "Submitted At",
            "Status",
          ]}
          cells={[
            <span key="name" className="font-medium text-primary-text">
              {kycCell(tier2.name)}
            </span>,
            <span key="idType" className="font-medium text-primary-text">
              {kycCell(tier2.idType)}
            </span>,
            <span key="idNumber" className="text-zinc-600">
              {kycCell(tier2.idNumber)}
            </span>,
            <span key="dob" className="whitespace-nowrap text-zinc-600">
              {kycCell(tier2.dateOfBirth || "")}
            </span>,
            <span key="gender" className="whitespace-nowrap text-zinc-600 capitalize">
              {kycCell(tier2.gender?.toLowerCase() || "")}
            </span>,
            <span key="issued" className="whitespace-nowrap text-zinc-600">
              {kycCell(tier2.dateIssued)}
            </span>,
            <span key="expiry" className="whitespace-nowrap text-zinc-600">
              {kycCell(tier2.dateOfExpiry)}
            </span>,
            <span key="provider" className="whitespace-nowrap text-zinc-600 capitalize">
              {kycCell(tier2.provider)}
            </span>,
            <span key="submitted" className="whitespace-nowrap text-zinc-600">
              {kycCell(tier2.submittedAt)}
            </span>,
            <KycStatusBadge key="status" status={tier2.status} />,
          ]}
        />
        {tier2.errorMessage && (
          <div className="mt-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-600">
            <strong>Verification Error:</strong> {tier2.errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}
