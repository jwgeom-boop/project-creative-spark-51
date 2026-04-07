import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  vendorName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const VendorDeleteDialog = ({ open, vendorName, onConfirm, onCancel }: Props) => (
  <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>업체를 삭제하시겠습니까?</AlertDialogTitle>
        <AlertDialogDescription>
          '{vendorName}'를 삭제하면 입주민 앱 서비스 페이지에서도 즉시 숨겨집니다.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onCancel}>취소</AlertDialogCancel>
        <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          삭제
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default VendorDeleteDialog;
