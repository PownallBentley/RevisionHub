import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function DevRpcTest() {
  const [out, setOut] = useState<any>(null);
  const [busy, setBusy] = useState(false);

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

    setOut({ data, error });
    setBusy(false);
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Dev RPC Test</h1>
      <button onClick={run} disabled={busy}>
        {busy ? "Running..." : "Run rpc_create_mnemonic_request"}
      </button>
      <pre style={{ marginTop: 16 }}>{JSON.stringify(out, null, 2)}</pre>
    </div>
  );
}
