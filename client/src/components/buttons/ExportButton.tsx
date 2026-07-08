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
      className="h-10 gap-2 rounded-xl border-slate-200 bg-white px-4 font-medium text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:shadow-md sm:px-5"
    >
      <Upload className="h-4 w-4" />
      Export
    </Button>
  );
};

export default ExportButton;
