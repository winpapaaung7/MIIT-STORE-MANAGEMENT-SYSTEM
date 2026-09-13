import { Plus } from "lucide-react";
import { Button } from "../ui/button";

interface AddItemButtonProps {
  onClick: () => void;
  label?: string;
}

const AddItemButton = ({ onClick, label = "Add Item" }: AddItemButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className="h-10 gap-2 rounded-xl bg-slate-900 px-4 text-white shadow-sm hover:bg-slate-800 hover:shadow-md sm:px-5"
    >
      <Plus className="h-4 w-4" />
      {label}
    </Button>
  );
};

export default AddItemButton;
