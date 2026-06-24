import { CheckCircle2, CircleDashed, GitBranch, LoaderCircle, XCircle } from "lucide-react";
import { useMemo } from "react";

import { AutomationRun, DraftAutomation, createAutomationGraph } from "../../shared/draftAutomation";

export function NodeGraphViewer({
  automation,
  latestRun
}: {
  automation: DraftAutomation;
  latestRun?: AutomationRun;
}) {
  const graph = useMemo(() => createAutomationGraph(automation, latestRun), [automation, latestRun]);

  return (
    <section className="node-graph-viewer" aria-label={`${graph.name} automation graph`}>
      <div className="node-graph-heading">
        <div>
          <p className="eyebrow">Node graph</p>
          <h3>Inspectable automation flow</h3>
        </div>
        <span>
          <GitBranch aria-hidden="true" size={15} />
          {graph.nodes.length} {graph.nodes.length === 1 ? "node" : "nodes"}
        </span>
      </div>

      <ol className="node-graph-list">
        {graph.nodes.map((node) => (
          <li key={node.id} className="node-graph-node">
            <div className="node-connector" aria-hidden="true">
              <span>{node.order}</span>
            </div>
            <div className="node-graph-body">
              <div className="node-graph-title-row">
                <div>
                  <h4>{node.title}</h4>
                  <p>{node.description}</p>
                </div>
                <div className="node-badges">
                  <span className="node-type">{node.nodeType}</span>
                  {node.runStatus ? <span className={`run-context ${node.runStatus}`}>{formatGraphStatus(node.runStatus)}</span> : null}
                </div>
              </div>

              {node.actionType ? <p className="node-action-context">Last action: {node.actionType}</p> : null}

              <dl className="node-metadata-list">
                {node.metadata.map((item) => (
                  <div key={item.kind}>
                    <dt>{item.label}</dt>
                    <dd>
                      <CircleDashed aria-hidden="true" size={13} />
                      {item.summary}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <NodeRunIcon status={node.runStatus} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function NodeRunIcon({ status }: { status: AutomationRun["steps"][number]["status"] | undefined }) {
  if (status === "failed" || status === "skipped") {
    return <XCircle aria-label={formatGraphStatus(status)} className="node-run-icon failed" size={17} />;
  }

  if (status === "running" || status === "pending" || status === "waiting_for_approval") {
    return <LoaderCircle aria-label={formatGraphStatus(status)} className="node-run-icon spin" size={17} />;
  }

  if (status === "completed") {
    return <CheckCircle2 aria-label={formatGraphStatus(status)} className="node-run-icon completed" size={17} />;
  }

  return null;
}

function formatGraphStatus(status: string): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
