import './types'
import '../electron/helpers/log'
import './helpers/events';

import React, {useState} from 'react';
import ReactDom from 'react-dom';
import {ChooseFile} from "./choose-file";
import {Display} from "./display";
import {TrimSlider} from "./components/trim-select";
import {ProcessingOverlay} from "./progress";
import css from './style.css';
import {ConfigMaxFileSize} from "./config/max-file-size";
import {ConfigConstantQuality} from "./config/constant-quality";
import {ConfigVideoSettings} from "./config/video-settings";
import {Loading} from "./components/loading";

import {
  Box,
  Button,
  Collapse,
  Divider,
  FormControl,
  Icon,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  ThemeProvider,
  Tooltip,
  Typography
} from "@material-ui/core";
import {Theme} from "./helpers/theme";
import {DurationInfo} from "./components/duration-info";
import {ErrorDisplayModal} from "./components/error";
import {BitrateWarnings} from "./components/bitrate-warnings";
import {PreventClosing} from "./components/prevent-closing";
import {FooterBranding} from "./components/footer-branding";

import BrokenImage from '@material-ui/icons/BrokenImage'
import PauseRounded from '@material-ui/icons/PauseRounded'
import PlayArrowRounded from '@material-ui/icons/PlayArrowRounded'
import Videocam from '@material-ui/icons/Videocam'

import '../common/sentry';
import {VideoHelpers} from "./helpers/video";
import {FeedbackModal} from "./components/feedback/Feedback";
import {AppState} from "./global-stores/AppState.store";
import {observer} from "mobx-react";
import {ProcessStore} from "./global-stores/Process.store";
import {toJS} from "mobx";
import {PlaybackStore} from "./global-stores/Playback.store";
import {eventList} from "./helpers/events";
import {Changelog} from "./components/changes-modal/changelog";
import {VolumeControl} from "./components/volume/volume-control";
import {ModalTrigger} from "./components/modals";
import {Settings} from "./settings/Settings";
import SettingsIcon from "@material-ui/icons/Settings";
import {CollapsableQueue, QueueComponent} from "./components/queue/Queue";
import classNames from "classnames";

const mainElement = document.createElement('div');
document.body.appendChild(mainElement);

// @ts-ignore
window.toJS = toJS

const App = observer(() => {
  mainElement.style.background = Theme.current.palette.background.default;

  const [showFeedback, setShowFeedback] = useState(false);

  const mediaNoVideo = ProcessStore.videoDetails && !ProcessStore.videoDetails.videoCodec;
  const mediaNotSupported = ProcessStore.videoDetails && (
    !VideoHelpers.supportedVideoCodec(ProcessStore.videoDetails.videoCodec || '') ||
    !VideoHelpers.supportedFormatContainer(ProcessStore.videoDetails.containerFormats) ||
    !VideoHelpers.supportedPixelFormat(ProcessStore.videoDetails.pixelFormat || '')
  );

  return (
    <ThemeProvider theme={Theme.current}>
      <div className={css.app}>
        <Paper elevation={3} className={css.header} square={true}>
          <ChooseFile className={css.flexGrow + ' ' + css.fileSelect}/>

          <ModalTrigger
            content={<Settings/>}
          >
            <Tooltip title="Preferences" arrow>
              <IconButton>
                <SettingsIcon/>
              </IconButton>
            </Tooltip>
          </ModalTrigger>

          <BitrateWarnings className={css.alert}/>
        </Paper>
        <Display className={css.display}>

          <Box className={css.children}>

            {mediaNoVideo && (
              <Typography variant="h5" color="textPrimary" align="center">
                🤔 No video detected
              </Typography>
            )}

            {!mediaNoVideo && mediaNotSupported && (
              <>
                <Icon fontSize="large" color="error">
                  <BrokenImage fontSize="inherit"/>
                </Icon>
                <Typography variant="h5" color="textPrimary" align="center">
                  Sorry, we can't preview this file
                </Typography>
                <Typography variant="h6" color="textPrimary" align="center">
                  You can still process it
                </Typography>
                <Typography variant="body2" color="textPrimary" align="center">
                  We're working on a solution in a future update
                </Typography>
              </>

            )}
          </Box>

          {!!ProcessStore.videoDetails && !mediaNoVideo && !mediaNotSupported && (
            <div
              className={css.controlsContainer}
            >
              <IconButton
                onClick={PlaybackStore.togglePlayback}
                style={{ fontSize: '100px' }}
              >
                {PlaybackStore.isPlaying ? <PauseRounded fontSize="inherit"/> : <PlayArrowRounded fontSize="inherit"/>}
              </IconButton>
            </div>
          )}

        </Display>

        <Paper className={css.footer} elevation={3} square={true}>
          {AppState.file ?
            <DurationInfo className={css.info}/> :
            null
          }

          <Box>
            <div className={css.trimAndVolume}>
              <TrimSlider/>
              <VolumeControl/>
            </div>
            <Box marginX={2} marginY={1} className={css.controls}>
              <div className={css.rows + ' ' + css.flexGrow}>

                <div className={css.settings}>
                  <div className={css.left}>
                    <FormControl>
                      <InputLabel id="strategy-label">Output must</InputLabel>
                      <Select
                        labelId={"strategy-label"}
                        value={ProcessStore.strategyType}
                        variant={"standard"}
                        onChange={
                          e => {
                            if (e.target.value === 'max-file-size') {
                              ProcessStore.setStrategyType('max-file-size');
                            } else {
                              ProcessStore.setStrategyType('constant-quality');
                            }
                          }
                        }
                      >
                        <MenuItem value={'max-file-size'}>have max file size of</MenuItem>
                        <MenuItem value={'constant-quality'}>be constant quality of</MenuItem>
                      </Select>
                    </FormControl>

                    {ProcessStore.strategyType === 'max-file-size' ?
                      <ConfigMaxFileSize/> :
                      <ConfigConstantQuality/>
                    }
                  </div>
                  <div className={css.right}>
                    <ConfigVideoSettings/>

                    <Box marginLeft={2}>
                      <Button
                        startIcon={<Videocam/>}
                        variant="contained"
                        className={css.processBtn}
                        color={"secondary"}
                        disabled={!AppState.file || !!mediaNoVideo}
                        onClick={ProcessStore.startProcessing}
                      >Process
                      </Button>
                    </Box>
                  </div>

                </div>

                <Box paddingY={1}>
                  <Divider/>
                </Box>

                <Box marginBottom={-1}>
                  <FooterBranding>
                    <Link onClick={() => {
                      setShowFeedback(true);
                      eventList.global.sendFeedback();
                    }}>
                      Send Feedback 👋
                    </Link>
                    &nbsp;|&nbsp;
                    <Changelog/>

                  </FooterBranding>
                </Box>
              </div>

            </Box>
          </Box>
        </Paper>

        <ProcessingOverlay/>

        {
          AppState.file && !ProcessStore.videoDetails ? <Loading/> : null
        }

        {
          ProcessStore.error ? <ErrorDisplayModal error={ProcessStore.error} onOk={() => {
            ProcessStore.setError(null);
          }}/> : null
        }

        <PreventClosing prevent={!!ProcessStore.processing}/>

        <FeedbackModal open={showFeedback} onClose={() => setShowFeedback(false)}/>

        <CollapsableQueue/>

      </div>
    </ThemeProvider>
  )
})

ReactDom.render(<App/>, mainElement);
