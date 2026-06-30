import { Plus } from "lucide-react";

import { SavedAutomation } from "../../shared/automationDraft";
import { AutomationRun } from "../../shared/automationRun";
import { formatStatus } from "./formatStatus";

export function SavedAutomationList({
  savedAutomations,
  latestRunByAutomationId,
  selectedAutomationId,
  onSelectNew,
  onSelectAutomation
}: {
  savedAutomations: SavedAutomation[];
  latestRunByAutomationId: Record<string, AutomationRun>;
  selectedAutomationId: string | null;
  onSelectNew: () => void;
  onSelectAutomation: (automationId: string) => void;
}) {
  return (
    <aside className="saved-automations" aria-label="Saved automations">
      <div className="saved-sidebar-header">
        <p className="eyebrow">Saved automations</p>
        <h2>Automations</h2>
      </div>

      <a
        className={`new-automation-button${selectedAutomationId ? "" : " active"}`}
        href="#new-automation"
        onClick={onSelectNew}
        aria-current={selectedAutomationId ? undefined : "page"}
      >
        <Plus aria-hidden="true" size={17} />
        New automation
      </a>

      {savedAutomations.length === 0 ? <p className="saved-empty">Saved drafts appear here.</p> : null}

      <ol className="saved-list">
        {savedAutomations.map((automation) => {
          const latestRun = latestRunByAutomationId[automation.id];
          const isSelected = selectedAutomationId === automation.id;

          return (
            <li key={automation.id} className="saved-item">
              <a
                className={`saved-item-link${isSelected ? " active" : ""}`}
                href={`#automation-${encodeURIComponent(automation.id)}`}
                onClick={() => onSelectAutomation(automation.id)}
                aria-current={isSelected ? "page" : undefined}
              >
                <div>
                  <h3>{automation.name}</h3>
                  <p>{automation.summary}</p>
                </div>
                <div className="saved-item-meta">
                  <span>
                    {automation.steps.length} {automation.steps.length === 1 ? "step" : "steps"}
                  </span>
                  {latestRun ? <span>{formatStatus(latestRun.status)}</span> : null}
                </div>
              </a>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}
