import React, {forwardRef, VideoHTMLAttributes} from "react";
import css from './style.css'

export interface DisplayProps extends VideoHTMLAttributes<HTMLVideoElement> {
  file: string
}

export const Display = forwardRef<HTMLVideoElement, DisplayProps>(function Display(props: DisplayProps, ref) {

  const { file, className, ...p } = props;

  return <div className={className}>
    <video className={css.video}
           ref={ref}
           src={props.file ? 'video://' + encodeURIComponent(props.file) : ''}
           controls={false}
           {...p}
    >
    </video>

    {props.children}
  </div>;

});
