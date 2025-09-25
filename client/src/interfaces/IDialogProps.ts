
export interface IDialogProps{
    isDialogOpen: boolean
    dialogType: string
    title: string
    description: string
    close: () => void
    clickAction: () => void 
}