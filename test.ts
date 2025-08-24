import { Parallel } from "parallel-web";

const parallel = new Parallel({ apiKey: env.PARALLEL_API_KEY });
const run = await parallel.taskRun.create({});
run.run_id;
