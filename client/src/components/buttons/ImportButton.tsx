import { Download } from "lucide-react";
import { Button } from "../ui/button";

interface ImportButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}

const ImportButton = ({ onClick, disabled, label = "Import" }: ImportButtonProps) => {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="h-10 gap-2 rounded-xl border-slate-200 bg-white px-4 font-medium text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:shadow-md sm:px-5"
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
};

export default ImportButton;
