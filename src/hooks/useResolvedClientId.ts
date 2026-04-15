import { useParams } from "react-router-dom";
import { useStudio } from "@/context/StudioContext";

export function useResolvedClientId() {
  const params = useParams();
  const { clientId: studioClientId } = useStudio();
  return params.clientId ?? studioClientId ?? null;
}
