import { useRef, useState } from "react";

export default function SpeechToText() {
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const processorRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  /** @type {"transient" | "save"} transient: 一時ファイルで文字起こし後削除 / save: 保存ダイアログ後に文字起こし */
  const [audioMode, setAudioMode] = useState("transient");

  const startRecording = async () => {
    setError("");

    if (!window.whisperAPI) {
      setError("whisperAPI が見つかりません。preload.js の設定を確認してください。");
      return;
    }

    try {
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      mediaStreamRef.current = stream;

      const audioContext = new AudioContext({
        sampleRate: 16000,
      });

      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        audioChunksRef.current.push(new Float32Array(inputData));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setListening(true);
    } catch (e) {
      console.error(e);

      if (e.name === "NotAllowedError") {
        setError("マイクの使用が許可されていません。");
      } else if (e.name === "NotFoundError") {
        setError("マイクが見つかりません。");
      } else {
        setError("録音開始に失敗しました。");
      }

      setListening(false);
    }
  };

  const stopRecording = async () => {
    setListening(false);
    setProcessing(true);
    setError("");

    try {
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
        processorRef.current = null;
      }

      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }

      if (audioContextRef.current) {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      if (audioChunksRef.current.length === 0) {
        setError("録音データがありません。");
        return;
      }

      const wavBlob = createWavBlob(audioChunksRef.current, 16000);
      const arrayBuffer = await wavBlob.arrayBuffer();

      const result = await window.whisperAPI.transcribe(arrayBuffer, {
        saveAudioBeforeTranscribe: audioMode === "save",
      });

      if (result && result.trim()) {
        setText((prev) => prev + result.trim() + "\n");
      } else {
        setError("文字起こし結果が空でした。");
      }
    } catch (e) {
      console.error(e);
      setError(e.message || "文字起こしに失敗しました。");
    } finally {
      audioChunksRef.current = [];
      setProcessing(false);
    }
  };

  const clearText = () => {
    setText("");
    setError("");
  };

  return (
    <div className="bg-white">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          音声文字起こし
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          マイクで録音した音声を whisper.cpp で日本語文字起こしします。
        </p>
      </div>

      <fieldset
        className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4"
        disabled={listening || processing}
      >
        <legend className="px-1 text-sm font-semibold text-gray-700">
          音声ファイルの扱い
        </legend>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="speech-audio-mode"
              className="mt-0.5"
              checked={audioMode === "transient"}
              onChange={() => setAudioMode("transient")}
            />
            <span>
              <span className="font-medium">一時ファイル（従来どおり）</span>
              <span className="mt-0.5 block text-xs text-gray-500">
                文字起こし後に音声ファイルは削除されます。
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name="speech-audio-mode"
              className="mt-0.5"
              checked={audioMode === "save"}
              onChange={() => setAudioMode("save")}
            />
            <span>
              <span className="font-medium">保存してから文字起こし</span>
              <span className="mt-0.5 block text-xs text-gray-500">
                停止時に保存先を選び、WAV を残したまま文字起こしします。
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={startRecording}
          disabled={listening || processing}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition ${
            listening || processing
              ? "cursor-not-allowed bg-gray-400"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          開始
        </button>

        <button
          onClick={stopRecording}
          disabled={!listening || processing}
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition ${
            !listening || processing
              ? "cursor-not-allowed bg-gray-400"
              : "bg-red-500 hover:bg-red-600"
          }`}
        >
          停止して文字起こし
        </button>

        <button
          onClick={clearText}
          disabled={listening || processing}
          className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
        >
          クリア
        </button>
      </div>

      <div className="mb-4">
        {listening ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-500" />
            録音中
          </div>
        ) : processing ? (
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-500" />
            文字起こし中
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
            停止中
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">
            文字起こし結果
          </h3>
          <span className="text-xs text-gray-400">{text.length} 文字</span>
        </div>

        <div className="min-h-64 whitespace-pre-wrap rounded-xl bg-white p-4 text-base leading-7 text-gray-800 shadow-inner">
          {text ? (
            <span>{text}</span>
          ) : (
            <span className="text-gray-400">
              ここに文字起こし結果が表示されます。
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function createWavBlob(audioChunks, sampleRate) {
  const length = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const samples = new Float32Array(length);

  let offset = 0;

  for (const chunk of audioChunks) {
    samples.set(chunk, offset);
    offset += chunk.length;
  }

  const wavBuffer = encodeWav(samples, sampleRate);

  return new Blob([wavBuffer], {
    type: "audio/wav",
  });
}

function encodeWav(samples, sampleRate) {
  const bytesPerSample = 2;
  const numChannels = 1;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");

  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);

  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  floatTo16BitPCM(view, 44, samples);

  return buffer;
}

function floatTo16BitPCM(view, offset, samples) {
  for (let i = 0; i < samples.length; i++) {
    let sample = Math.max(-1, Math.min(1, samples[i]));
    sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    view.setInt16(offset + i * 2, sample, true);
  }
}

function writeString(view, offset, text) {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}