import {JSONProtocol} from "../base-protocols";
import {TrimPostData} from "../../types";
import {FFMpegError, FFMpegProgress} from "ffmpeg-progress-wrapper";
import {IFFMpegProgressData} from "ffmpeg-progress-wrapper/src/index";
import {v4 as uuid} from 'uuid'
import {VideoProcess} from "../../helpers/ff/process";

export namespace TrimProtocol {

  type Task = {
    id: string
    process: FFMpegProgress | null
    progress: IFFMpegProgressData | null
    done: boolean
    error: FFMpegError | null
    cancelled: boolean
    promise: Promise<string> | null
  }

  export type TrimCheckResponse = Task | null;
  export type TrimStartResponse = { id: string };

  export class TrimProtocol extends JSONProtocol {

    readonly tasks: Task[]

    constructor() {
      super('trim');
      this.tasks = [];
    }

    async onRequest(req: Electron.Request, payload: TrimPostData): Promise<any> {
      const pathname = req.url.replace(`${this.protocolName}://`, '');

      switch (req.method) {
        case 'POST':
          return this.startTrim(pathname, payload);
        case 'GET':
          return this.checkTrim(pathname);
        case 'DELETE':
          return this.cancelTrim(pathname);
      }
      return {};
    }

    startTrim(path: string, data: TrimPostData): TrimStartResponse {
      const id = uuid();

      const task: Task = {
        id,
        process: null,
        promise: Promise.resolve(''),
        progress: null,
        error: null,
        done: false,
        cancelled: false
      }

      task.process = VideoProcess.process(
        path,
        data.start,
        data.end,
        data.out,
        data.strategy,
        data.settings,
        p => task.progress = p
      );
      task.promise = task.process.onDone();

      task.promise
        .catch((e) => {
          task.error = { ...e };
          task.error!.stack = e.stack;
          task.error!.message = e.message;
        })
        .finally(() => task.done = true);

      this.tasks.push(task);

      return { id };
    }

    checkTrim(id: string): TrimCheckResponse {
      const task = this.tasks.find(t => t.id === id);

      if (!task) return null;
      return {
        ...task,
        process: null,
        promise: null
      };
    }

    cancelTrim(id: string) {
      const task = this.tasks.find(t => t.id === id);

      if (!task) return null;

      if (!task.process) return null;

      if (task.cancelled) return null;

      task.cancelled = true;
      task.process.kill('SIGINT');

      return {};
    }
  }

}