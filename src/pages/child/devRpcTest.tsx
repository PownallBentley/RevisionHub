import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function DevRpcTest() {
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<any>(null);

  async function run() {
    setBusy(true);
    setOut(null);

    const { data, error } = await supabase.rpc("rpc_create_mnemonic_request", {
      p_original_prompt: "Chemistry | Acid Strength | style=hip-hop | step=summary",
      p_subject: "Chemistry",
      p_level: "gcse",
      p_exam_board: null,
      p_parsed_topic: null,
      p_parsed_style: null,
      p_parsed_type: null,
    });

    setOut({
      ok: !error,
      data,
      error,
    });

    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-card p-6">
        <h1 className="text-2xl font-bold text-primary-900 mb-2">Dev RPC Test</h1>
        <p className="text-neutral-600 mb-6">
          Calls <code className="bg-neutral-100 px-2 py-1 rounded">rpc_create_mnemonic_request</code> as the
          currently signed-in user.
        </p>

        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50"
        >
          {busy ? "Running..." : "Run RPC"}
        </button>

        <div className="mt-6">
          <h2 className="font-semibold text-neutral-700 mb-2">Output</h2>
          <pre className="text-xs bg-neutral-100 rounded-xl p-4 overflow-auto">
{JSON.stringify(out, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
