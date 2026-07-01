import { Upload } from "lucide-react";
import { Button } from "../ui/button";

interface ExportButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const ExportButton = ({ onClick, disabled }: ExportButtonProps) => {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="h-11 px-6 rounded-xl gap-2 font-medium"
    >
      <Upload className="h-4 w-4" />
      Export
    </Button>
  );
};

export default ExportButton;
