import { Plus } from "lucide-react";

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
      className="h-10 gap-2"
    >
      <Plus className="h-4 w-4" />
      {t("add")} {t("department")}
    </Button>
  );
};

export default AddNewDeptButton;
