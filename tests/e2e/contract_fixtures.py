"""Known editor inputs for delivery smoke tests. No in-game answer panel is required."""
import json
import subprocess
from functools import cache
from pathlib import Path

@cache
def contract_files():
    script = """
      import {CAREER_JOBS} from './lib/game/career-content.ts';
      import {exampleSolution} from './lib/game/career-evaluation.ts';
      import {RELEASE_EXAMPLE} from './lib/game/release.ts';
      const all=Object.fromEntries(CAREER_JOBS.map(job=>[job.id,exampleSolution(job.id)]));
      console.log(JSON.stringify({...all,legacyRelease:RELEASE_EXAMPLE}));
    """
    output = subprocess.check_output(
        ['node', '--input-type=module', '-e', script],
        cwd=Path(__file__).resolve().parents[2], encoding='utf-8',
    )
    return json.loads(output)
