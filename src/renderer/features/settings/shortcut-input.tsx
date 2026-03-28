import React, { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Kbd } from '../../../components/ui/kbd';
import { useValidateShortcut, useUpdateShortcut } from './use-settings';
import { isErr } from '../../../shared/types';

interface ShortcutInputProps {
  label: string;
  settingKey: 'quickTranslateShortcut' | 'toggleAppShortcut';
  currentValue: string;
}

export function ShortcutInput({ label, settingKey, currentValue }: ShortcutInputProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(currentValue);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutate: validate, isPending: isValidating } = useValidateShortcut();
  const { mutate: update, isPending: isSaving } = useUpdateShortcut();

  function handleSave() {
    setValidationError(null);
    validate(draft, {
      onSuccess: (result) => {
        if (isErr(result)) {
          setValidationError(result.error.message);
          return;
        }
        update(
          { key: settingKey, value: draft },
          {
            onSuccess: (updateResult) => {
              if (updateResult.success) setEditing(false);
            },
          },
        );
      },
    });
  }

  function handleCancel() {
    setDraft(currentValue);
    setValidationError(null);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  }

  const isPending = isValidating || isSaving;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium">{label}</span>
      {editing ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setValidationError(null);
              }}
              onKeyDown={handleKeyDown}
              className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm font-mono shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="e.g. CommandOrControl+Alt+T"
            />
            <Button size="icon" variant="ghost" onClick={handleSave} disabled={isPending} title="Save">
              {isPending ? <Loader2 className="animate-spin size-4" /> : <Check className="size-4" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={handleCancel} disabled={isPending} title="Cancel">
              <X className="size-4" />
            </Button>
          </div>
          {validationError && (
            <span className="text-xs text-destructive">{validationError}</span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 min-w-0">
          <Kbd className="flex-1 min-h-9 h-auto min-w-0 w-full justify-start px-2.5 py-1.5 font-mono text-xs leading-snug [overflow-wrap:anywhere] pointer-events-auto select-all">
            {currentValue}
          </Kbd>
          <Button size="sm" variant="outline" onClick={() => { setDraft(currentValue); setEditing(true); }}>
            Change
          </Button>
        </div>
      )}
    </div>
  );
}
