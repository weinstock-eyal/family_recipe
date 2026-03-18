"use client";

import { Plus, X, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InstructionSection } from "@/src/db/schema";

type Props = {
  sections: InstructionSection[];
  onChange: (sections: InstructionSection[]) => void;
};

export function InstructionFormList({ sections, onChange }: Props) {
  function addStep(sectionIndex: number) {
    const updated = sections.map((s, i) =>
      i === sectionIndex ? { ...s, steps: [...s.steps, ""] } : s
    );
    onChange(updated);
  }

  function removeStep(sectionIndex: number, stepIndex: number) {
    const updated = sections.map((s, i) =>
      i === sectionIndex
        ? { ...s, steps: s.steps.filter((_, j) => j !== stepIndex) }
        : s
    );
    onChange(updated);
  }

  function updateStep(sectionIndex: number, stepIndex: number, value: string) {
    const updated = sections.map((s, si) =>
      si === sectionIndex
        ? { ...s, steps: s.steps.map((step, ii) => (ii === stepIndex ? value : step)) }
        : s
    );
    onChange(updated);
  }

  function updateSectionName(sectionIndex: number, name: string) {
    const updated = sections.map((s, i) =>
      i === sectionIndex ? { ...s, name } : s
    );
    onChange(updated);
  }

  function addSection() {
    onChange([...sections, { name: "", steps: [""] }]);
  }

  function removeSection(sectionIndex: number) {
    onChange(sections.filter((_, i) => i !== sectionIndex));
  }

  return (
    <div className="space-y-6">
      {sections.map((section, si) => (
        <div key={si} className="space-y-3">
          {(sections.length > 1 || section.name) && (
            <div className="flex items-center gap-2">
              <Input
                placeholder="שם החלק (למשל: הכנת הבצק, הכנת הרוטב)"
                value={section.name ?? ""}
                onChange={(e) => updateSectionName(si, e.target.value)}
                className="flex-1 font-semibold"
              />
              {sections.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSection(si)}
                >
                  <X className="size-4" />
                </Button>
              )}
            </div>
          )}

          {section.steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                {i + 1}
              </span>
              <Input
                placeholder={`שלב ${i + 1}`}
                value={step}
                onChange={(e) => updateStep(si, i, e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeStep(si, i)}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addStep(si)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            הוסף שלב
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addSection}
        className="gap-1.5"
      >
        <Layers className="size-4" />
        הוסף חלק
      </Button>
    </div>
  );
}
