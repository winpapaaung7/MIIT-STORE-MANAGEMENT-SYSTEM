import { Plus } from "lucide-react";
import { Button } from "../ui/button";

interface AddItemButtonProps {
  onClick: () => void;
}

const AddItemButton = ({ onClick }: AddItemButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className="h-11 px-6 rounded-xl gap-2 bg-slate-900 hover:bg-slate-800"
    >
      <Plus className="h-4 w-4" />
      Add Item
    </Button>
  );
};

export default AddItemButton;
