/* eslint-disable jsx-a11y/no-static-element-interactions -- noop */
import { useEffect, useReducer, useRef, useState } from "react";

const INIT = {
  statements: [],
} satisfies State;

const HEIGHT = 720;
const WIDTH = 1280;
function randomPick(size: number) {
  return Math.floor(Math.random() * size);
}

type Statement = {
  message: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    inline: number;
    block: number;
  };
  paddingInline: number;
  paddingBlock: number;
  textColor: string;
  backgroundColor: string;
  lineBoxBackgroundColor: string;
  backgroundAlpha: number;
  fontSize: number;
  fontFamily: string;
  textAlign: "start" | "end" | "center";
  writingMode: "horizontal-tb" | "vertical-rl" | "vertical-lr";
};
type State = {
  statements: Statement[];
};

type Action =
  | {
      type: "ADD_STATEMENT";
    }
  | {
      type: "REMOVE_STATEMENT";
      payload: number;
    }
  | {
      type: "UPDATE_STATEMENT";
      payload: {
        index: number;
        statement: Partial<Statement>;
      };
    };

const WRITING_MODES: Array<Statement["writingMode"]> = [
  "horizontal-tb",
  "vertical-rl",
  // "vertical-lr",
];

function randomColor() {
  return `#${Math.floor(Math.random() * 192).toString(
    16,
  )}${Math.floor(Math.random() * 192).toString(16)}${Math.floor(
    Math.random() * 192,
  ).toString(16)}`;
}

function randomString(length: number) {
  const あ = "あ".codePointAt(0)!;
  const ん = "ん".codePointAt(0)!;
  return Array.from({ length }, () =>
    // ひらがなの範囲でランダムな文字を生成
    String.fromCodePoint(あ + Math.floor(Math.random() * (ん - あ))),
  ).join("");
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_STATEMENT": {
      return {
        ...state,
        statements: [
          ...state.statements,
          {
            message: `rand:${randomString(24)}`,
            position: {
              x: Math.floor(Math.random() * WIDTH),
              y: Math.floor(Math.random() * HEIGHT),
            },
            size: {
              inline: 200,
              block: 0,
            },
            textColor: randomColor(),
            backgroundColor: "#ffffff",
            backgroundAlpha: 1,
            lineBoxBackgroundColor: "#ffffff",
            fontSize: 32,
            fontFamily: "Arial",
            textAlign: "start",
            writingMode: "horizontal-tb",
            paddingInline: 8,
            paddingBlock: 8,
          },
        ],
      };
    }
    case "REMOVE_STATEMENT": {
      return {
        ...state,
        statements: state.statements.filter(
          (_, index) => index !== action.payload,
        ),
      };
    }
    case "UPDATE_STATEMENT": {
      return {
        ...state,
        statements: state.statements.map((statement, index) => {
          if (index === action.payload.index) {
            return {
              ...statement,
              ...action.payload.statement,
            };
          }
          return statement;
        }),
      };
    }
    default: {
      return state;
    }
  }
}

function StatementView({
  statement,
  onDragStart,
  updateStatement,
}: {
  readonly statement: Statement;
  readonly onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  readonly updateStatement: (statement: Partial<Statement>) => void;
}) {
  // resize observer
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const inlineSize = statement.writingMode.startsWith("vertical")
          ? entry.contentRect.height
          : entry.contentRect.width;
        updateStatement({
          size: {
            inline: inlineSize,
            block: 0,
          },
        });
      }
    });
    ro.observe(ref.current);
    return () => {
      ro.disconnect();
    };
  }, [ref.current]);
  return (
    <div
      style={{
        position: "absolute",
        left: `${statement.position.x}px`,
        top: `${statement.position.y}px`,
        color: statement.textColor,
        backgroundColor: statement.backgroundColor,
        fontSize: `${statement.fontSize}px`,
        fontFamily: statement.fontFamily,
        textAlign: statement.textAlign,
        writingMode: statement.writingMode,
        overflowWrap: "break-word",
        resize: "inline",
        overflow: "auto",
        whiteSpace: "pre-wrap",
        // inline/blockだとresize時に負ける
        ...(statement.writingMode.startsWith("vertical")
          ? {
              width: `max-content !important`,
              height: `${statement.size.inline}px`,
            }
          : {
              width: `${statement.size.inline}px`,
              height: `max-content !important`,
            }),
      }}
      onDragStart={onDragStart}
      draggable
      // contentEditable="plaintext-only"
      // onInput={(e) => {
      //   updateStatement({ message: e.currentTarget.innerText }); // innerText を取得して状態に保存
      // }}
    >
      <span
        style={{
          display: "inline block",
          backgroundColor: statement.lineBoxBackgroundColor,
        }}
      >
        {statement.message}
      </span>
    </div>
  );
}

function App() {
  const [state, update] = useReducer(reducer, INIT);
  function addStatement() {
    update({ type: "ADD_STATEMENT" });
  }

  function removeStatement(index: number) {
    update({ type: "REMOVE_STATEMENT", payload: index });
  }

  function updateStatement(index: number, statement: Partial<Statement>) {
    update({ type: "UPDATE_STATEMENT", payload: { index, statement } });
  }

  const [draggingIndex, setDraggingIndex] = useState(-1);
  const [draggingOffsetX, setDraggingOffsetX] = useState(0);
  const [draggingOffsetY, setDraggingOffsetY] = useState(0);
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState("#ffffff");

  return (
    <div>
      <div
        style={{
          width: "1280px",
          height: "720px",
          border: "1px solid #444",
          position: "relative",
          backgroundColor: canvasBackgroundColor,
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          const index = draggingIndex;
          const x = e.clientX - draggingOffsetX;
          const y = e.clientY - draggingOffsetY;
          updateStatement(index, {
            position: { x, y },
          });
          setDraggingIndex(-1);
        }}
      >
        {state.statements.map((statement, index) => (
          <StatementView
            key={index}
            statement={statement}
            onDragStart={(e) => {
              const target = e.currentTarget;
              setDraggingIndex(index);
              setDraggingOffsetX(e.clientX - target.offsetLeft);
              setDraggingOffsetY(e.clientY - target.offsetTop);
            }}
            updateStatement={(statement) => updateStatement(index, statement)}
          />
        ))}
      </div>
      <div>
        <div>
          <label>
            canvas background:
            <input
              type="color"
              value={canvasBackgroundColor}
              onChange={(e) => setCanvasBackgroundColor(e.currentTarget.value)}
            />
          </label>
        </div>
        <div>
          <button type="button" onClick={() => addStatement()}>
            add
          </button>
        </div>
        {state.statements.map((statement, index) => {
          return (
            <div key={index}>
              <label>
                msg:{" "}
                <textarea
                  value={statement.message}
                  onChange={(e) =>
                    updateStatement(index, { message: e.currentTarget.value })
                  }
                />
              </label>
              <label>
                font:
                <input
                  type="text"
                  value={statement.fontFamily}
                  onChange={(e) =>
                    updateStatement(index, {
                      fontFamily: e.currentTarget.value,
                    })
                  }
                />
              </label>
              <label>
                font size:
                <input
                  type="number"
                  value={statement.fontSize}
                  onChange={(e) =>
                    updateStatement(index, {
                      fontSize: Number(e.currentTarget.value),
                    })
                  }
                />
              </label>
              <label>
                x:
                <input
                  type="number"
                  value={statement.position.x}
                  onChange={(e) =>
                    updateStatement(index, {
                      position: {
                        ...statement.position,
                        x: Number(e.currentTarget.value),
                      },
                    })
                  }
                />
              </label>
              <label>
                y:
                <input
                  type="number"
                  value={statement.position.y}
                  onChange={(e) =>
                    updateStatement(index, {
                      position: {
                        ...statement.position,
                        y: Number(e.currentTarget.value),
                      },
                    })
                  }
                />
              </label>
              <label>
                inline size:
                <input
                  type="number"
                  value={statement.size.inline}
                  onChange={(e) =>
                    updateStatement(index, {
                      size: {
                        ...statement.size,
                        inline: Number(e.currentTarget.value),
                      },
                    })
                  }
                />
              </label>
              <label>
                block size:
                <input
                  type="number"
                  value={statement.size.block}
                  onChange={(e) =>
                    updateStatement(index, {
                      size: {
                        ...statement.size,
                        block: Number(e.currentTarget.value),
                      },
                    })
                  }
                />
              </label>
              <label>
                color:
                <input
                  type="color"
                  value={statement.textColor}
                  onChange={(e) => {
                    updateStatement(index, {
                      textColor: e.currentTarget.value,
                    });
                  }}
                />
              </label>
              <label>
                background:
                <input
                  type="color"
                  value={statement.backgroundColor}
                  onChange={(e) =>
                    updateStatement(index, {
                      backgroundColor: e.currentTarget.value,
                    })
                  }
                />
              </label>
              <label>
                linebox background:
                <input
                  type="color"
                  value={statement.lineBoxBackgroundColor}
                  onChange={(e) =>
                    updateStatement(index, {
                      lineBoxBackgroundColor: e.currentTarget.value,
                    })
                  }
                />
              </label>
              <label>
                background alpha:
                <input
                  type="number"
                  value={statement.backgroundAlpha}
                  onChange={(e) =>
                    updateStatement(index, {
                      backgroundAlpha: Number(e.currentTarget.value),
                    })
                  }
                />
              </label>
              <label>
                writing mode:
                <select
                  value={statement.writingMode}
                  onChange={(e) =>
                    updateStatement(index, {
                      writingMode: e.currentTarget
                        .value as Statement["writingMode"],
                    })
                  }
                >
                  <option value="horizontal-tb">horizontal-tb</option>
                  <option value="vertical-rl">vertical-rl</option>
                  <option value="vertical-lr">vertical-lr</option>
                </select>
              </label>

              <label>
                text align:
                <select
                  value={statement.textAlign}
                  onChange={(e) =>
                    updateStatement(index, {
                      textAlign: e.currentTarget
                        .value as Statement["textAlign"],
                    })
                  }
                >
                  <option value="start">start</option>
                  <option value="end">end</option>
                  <option value="center">center</option>
                </select>
              </label>

              <button type="button" onClick={() => removeStatement(index)}>
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
