"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  KeyRound,
  Trash2,
  Loader2,
  UserX,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AdminUserForm } from "@/components/admin-user-form";
import {
  resetPasswordAction,
  toggleUserActiveAction,
  deleteUserAction,
} from "@/app/admin/users/actions";

type User = {
  id: number;
  email: string;
  displayName: string;
  role: string;
  isActive: number;
  createdAt: Date;
};

type Props = {
  users: User[];
  currentUserId: number;
};

export function AdminUserTable({ users, currentUserId }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>שם תצוגה</TableHead>
          <TableHead>אימייל</TableHead>
          <TableHead>תפקיד</TableHead>
          <TableHead>סטטוס</TableHead>
          <TableHead>תאריך הצטרפות</TableHead>
          <TableHead>פעולות</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">
              {user.displayName}
              {user.id === currentUserId && (
                <Badge variant="outline" className="mr-2 text-xs">
                  אתה
                </Badge>
              )}
            </TableCell>
            <TableCell dir="ltr" className="text-right">{user.email}</TableCell>
            <TableCell>
              <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                {user.role === "admin" ? "אדמין" : "חבר משפחה"}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={user.isActive ? "default" : "destructive"}>
                {user.isActive ? "פעיל" : "לא פעיל"}
              </Badge>
            </TableCell>
            <TableCell>{format(new Date(user.createdAt), "dd/MM/yyyy")}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <AdminUserForm mode="edit" user={user} />
                <ResetPasswordButton userId={user.id} userName={user.displayName} />
                <ToggleActiveButton
                  userId={user.id}
                  userName={user.displayName}
                  isActive={user.isActive}
                  isSelf={user.id === currentUserId}
                />
                <DeleteUserButton
                  userId={user.id}
                  userName={user.displayName}
                  isSelf={user.id === currentUserId}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// --- Reset Password Dialog ---

function ResetPasswordButton({
  userId,
  userName,
}: {
  userId: number;
  userName: string;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (newOpen) {
      setNewPassword("");
      setError(null);
      setSuccess(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const result = await resetPasswordAction({ id: userId, newPassword });
    setSaving(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setOpen(false), 1500);
    } else {
      setError(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <KeyRound className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>איפוס סיסמה</DialogTitle>
          <DialogDescription>
            איפוס סיסמה עבור {userName}
          </DialogDescription>
        </DialogHeader>
        {success ? (
          <p className="text-sm text-green-600">הסיסמה אופסה בהצלחה!</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">סיסמה חדשה</Label>
              <Input
                id="newPassword"
                type="password"
                dir="ltr"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                ביטול
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    מאפס...
                  </>
                ) : (
                  "איפוס סיסמה"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- Toggle Active Dialog ---

function ToggleActiveButton({
  userId,
  userName,
  isActive,
  isSelf,
}: {
  userId: number;
  userName: string;
  isActive: number;
  isSelf: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setSaving(true);
    setError(null);

    const result = await toggleUserActiveAction({
      id: userId,
      isActive: isActive ? 0 : 1,
    });

    setSaving(false);
    if (result.success) {
      setOpen(false);
    } else {
      setError(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isSelf}
          />
        }
      >
        {isActive ? (
          <UserX className="size-4" />
        ) : (
          <UserCheck className="size-4" />
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isActive ? "השבתת משתמש" : "הפעלת משתמש"}
          </DialogTitle>
          <DialogDescription>
            {isActive
              ? `האם להשבית את ${userName}? המשתמש לא יוכל להתחבר למערכת.`
              : `האם להפעיל מחדש את ${userName}?`}
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={saving}
          >
            ביטול
          </Button>
          <Button
            variant={isActive ? "destructive" : "default"}
            onClick={handleToggle}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {isActive ? "משבית..." : "מפעיל..."}
              </>
            ) : isActive ? (
              "כן, השבת"
            ) : (
              "כן, הפעל"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Delete User Dialog ---

function DeleteUserButton({
  userId,
  userName,
  isSelf,
}: {
  userId: number;
  userName: string;
  isSelf: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);

    const result = await deleteUserAction({ id: userId });
    setDeleting(false);

    if (result.success) {
      setOpen(false);
    } else {
      setError(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={isSelf}
          />
        }
      >
        <Trash2 className="size-4 text-destructive" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>מחיקת משתמש</DialogTitle>
          <DialogDescription>
            האם למחוק את {userName}? פעולה זו לא ניתנת לביטול.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={deleting}
          >
            ביטול
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                מוחק...
              </>
            ) : (
              "כן, מחק"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
