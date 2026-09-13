import { HousePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

interface AddNewDeptButtonProps {
  onClick: () => void;
}

const AddNewDeptButton = ({ onClick }: AddNewDeptButtonProps) => {
  const { t } = useLanguage();
  return (
    <Button
      onClick={onClick}
      className="h-11 rounded-xl gap-2 bg-slate-900 px-6 hover:bg-slate-800"
    >
      <HousePlus className="h-4 w-4" />
      {t("add")}
    </Button>
  );
};

export default AddNewDeptButton;
