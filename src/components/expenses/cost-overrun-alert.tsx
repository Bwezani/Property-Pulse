import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

type CostOverrunAlertProps = {
  reason?: string;
}

export function CostOverrunAlert({ reason }: CostOverrunAlertProps) {
  if (!reason) return null;

  return (
    <Alert variant="destructive" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>AI-Detected Cost Overrun</AlertTitle>
      <AlertDescription>
        {reason}
      </AlertDescription>
    </Alert>
  )
}
