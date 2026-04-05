import { Suspense } from "react";
import { EnergyDiagnosis } from "@/components/energy-diagnosis";

export default function DiagnosisPage() {
  return (
    <Suspense fallback={null}>
      <EnergyDiagnosis />
    </Suspense>
  );
}
