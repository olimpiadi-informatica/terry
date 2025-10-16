import { ContestStatus } from "src/types/contest";
import { useCommunicationNotifier } from "src/hooks/useCommunication";

interface ContestFeaturesProps {
  contest: ContestStatus;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ContestFeatures(_: ContestFeaturesProps) {
  useCommunicationNotifier();
  return null; // This component doesn't render anything visible
}

export { ContestFeatures };
