import type {TrimProtocol} from "../../electron/protocols/proto/trim";
import {RenderStrategy, VideoSettings} from "../../electron/types";
import {DetailsProtocol} from "../../electron/protocols/proto/details";
import {VideoDetails} from "../../electron/helpers/ff/details";
import {round} from "./math";

export namespace TrimComms {

  export async function checkProcess(id: string): Promise<TrimProtocol.TrimCheckResponse> {
    const f = await fetch('trim://' + id, {
      method: 'get'
    });
    const data: TrimProtocol.TrimCheckResponse = await f.json();

    return data;
  }

  export async function startProcess(fileIn: string, fileOut: string, range: { start: number, end: number }, strategy: RenderStrategy, settings: VideoSettings): Promise<TrimProtocol.TrimStartResponse> {

    const f = await fetch('trim://' + fileIn, {
      method: 'post',
      body: JSON.stringify({
        start: range.start,
        end: range.end,
        out: fileOut,
        strategy,
        settings
      }),
      headers: { 'content-type': 'application/json' }
    });

    const data: TrimProtocol.TrimStartResponse = await f.json();

    return data;
  }

  export async function cancelProcess(id: string) {
    const f = await fetch('trim://' + id, {
      method: 'delete'
    });

    const data = await f.json();

    return data;
  }

}

export namespace DetailsComms {

  export type SimpleVideoDetails = {
    fps: number
    width: number
    height: number
    duration: number
  }

  export async function getDetails(file: string): Promise<DetailsProtocol.DetailsProtocolResponse> {
    const f = await fetch('details://' + file, {
      method: 'get',

    });
    const data: DetailsProtocol.DetailsProtocolResponse = await f.json();

    return data;
  }

  export function videoStream(data: DetailsProtocol.DetailsProtocolResponse): VideoDetails.VideoStream | null {
    return data.streams.find((x): x is VideoDetails.VideoStream => x.codec_type === 'video') || null;
  }

  export function duration(data: DetailsProtocol.DetailsProtocolResponse): number {
    return parseFloat(data.format.duration || videoStream(data)?.duration || '0');
  }

  export function frameSize(data: DetailsProtocol.DetailsProtocolResponse): { width: number, height: number } {
    const video = videoStream(data);
    if (!video) return { height: 0, width: 0 };

    return {
      width: video.width,
      height: video.height,
    }
  }

  export function fps(data: DetailsProtocol.DetailsProtocolResponse): number {
    const video = videoStream(data);
    if (!video) return 0;

    return round(
      (
        VideoDetails.parseStringFraction(video.avg_frame_rate || '0/0') ||
        VideoDetails.parseStringFraction(video.r_frame_rate || '0/0') ||
        0
      ),
      2
    )
  }

  export function simplifyMediaDetails(data: DetailsProtocol.DetailsProtocolResponse): SimpleVideoDetails {
    return {
      fps: fps(data),
      duration: duration(data),
      ...frameSize(data)
    }
  }
}