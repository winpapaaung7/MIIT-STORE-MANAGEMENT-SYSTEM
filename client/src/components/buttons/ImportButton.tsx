import { Download } from "lucide-react";
import { Button } from "../ui/button";

interface ImportButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const ImportButton = ({ onClick, disabled }: ImportButtonProps) => {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="h-11 px-6 rounded-xl gap-2 font-medium"
    >
      <Download className="h-4 w-4" />
      Import
    </Button>
  );
};

export default ImportButton;
