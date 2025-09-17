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
  clickAction,
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
    setTimeout(() => {
      try {
        clickAction();
      } catch (err) {
        console.log(err);
      } finally {
        setIsPerformingAction(false);
      }
    }, 1200);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={close}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
