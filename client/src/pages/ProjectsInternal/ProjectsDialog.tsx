import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import { IDialogProps } from "@/interfaces/IDialogProps";

const ProjectsDialog: React.FC<IDialogProps> = ({
  isDialogOpen,
  dialogType,
  title,
  description,
  close,
  clickDialogAction,
}) => {
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  const getButtonName = () => {
    if (dialogType === "delete") {
      return "Delete";
    }
  };

  const getActionName = () => {
    if (dialogType === "delete") {
      return "Deleting";
    }
  };

  const onClick = () => {
    setIsPerformingAction(true);
    setTimeout(async () => {
      await clickDialogAction();
      setTimeout(() => {
        setIsPerformingAction(false);
      }, 200);
    }, 1200);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={close}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription className="text-md">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {!isPerformingAction ? (
            <div>
              <Button variant="outline" onClick={close} className="mr-2">
                Cancel
              </Button>
              <Button onClick={onClick}>{getButtonName()}</Button>
            </div>
          ) : (
            <div>{getActionName()}...</div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectsDialog;
