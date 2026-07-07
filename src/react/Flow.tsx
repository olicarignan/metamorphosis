"use client";

// React wrapper for the vendored flow engine (src/flow). Ported
// from @number-flow/react (MIT, © Maxwell Barvian) so the flow animation uses
// the exact same digit-reel handling as the upstream project, kept dependency-
// free. This is entirely separate from TextMorph's cascade.

import * as React from "react";
import FlowLite, {
  type Value,
  type Format,
  type Props,
  renderInnerHTML,
  formatToData,
  type Data,
  define,
} from "../flow/lite";

const BROWSER = typeof document !== "undefined";

const REACT_MAJOR = parseInt(React.version.match(/^(\d+)\./)?.[1]!);
const isReact19 = REACT_MAJOR >= 19;

const OBSERVED_ATTRIBUTES = ["data", "digits"] as const;
type ObservedAttribute = (typeof OBSERVED_ATTRIBUTES)[number];

export class FlowElement extends FlowLite {
  static observedAttributes = isReact19 ? [] : OBSERVED_ATTRIBUTES;
  attributeChangedCallback(
    attr: ObservedAttribute,
    _oldValue: string,
    newValue: string,
  ) {
    this[attr] = JSON.parse(newValue);
  }
}

define("flow-react", FlowElement);

type BaseProps = React.HTMLAttributes<FlowElement> &
  Partial<Props> & {
    isolate?: boolean;
    willChange?: boolean;
    onAnimationsStart?: (e: CustomEvent<undefined>) => void;
    onAnimationsFinish?: (e: CustomEvent<undefined>) => void;
  };

type FlowImplProps = BaseProps & {
  innerRef: React.MutableRefObject<FlowElement | undefined>;
  group?: GroupContext;
  data: Data;
};

// Cache formatters between uses (per MDN guidance). Serialize to strings b/c
// React only diffs primitives cheaply.
const formatters: Record<string, Intl.NumberFormat> = {};

function identity<T>(v: T) {
  return v;
}
const serialize = isReact19 ? identity : JSON.stringify;

function splitProps<T extends Record<string, any>>(
  props: T,
): [Omit<Props, "digits">, Omit<T, keyof Omit<Props, "digits">>] {
  const {
    transformTiming,
    spinTiming,
    opacityTiming,
    animated,
    respectMotionPreference,
    trend,
    plugins,
    ...rest
  } = props;

  return [
    {
      transformTiming,
      spinTiming,
      opacityTiming,
      animated,
      respectMotionPreference,
      trend,
      plugins,
    },
    rest,
  ];
}

type FlowImplState = {};
type FlowImplSnapshot = (() => void) | null;

// A class component is required to use getSnapshotBeforeUpdate (FLIP timing).
class FlowImpl extends React.Component<
  FlowImplProps,
  FlowImplState,
  FlowImplSnapshot
> {
  constructor(props: FlowImplProps) {
    super(props);
    this.handleRef = this.handleRef.bind(this);
  }

  updateProperties(prevProps?: Readonly<FlowImplProps>) {
    if (!this.el) return;

    this.el.batched = !this.props.isolate;
    const [nonData] = splitProps(this.props);
    Object.entries(nonData).forEach(([k, v]) => {
      // @ts-ignore
      this.el![k] = v ?? FlowElement.defaultProps[k];
    });

    if (prevProps?.onAnimationsStart)
      this.el.removeEventListener(
        "animationsstart",
        prevProps.onAnimationsStart as EventListener,
      );
    if (this.props.onAnimationsStart)
      this.el.addEventListener(
        "animationsstart",
        this.props.onAnimationsStart as EventListener,
      );

    if (prevProps?.onAnimationsFinish)
      this.el.removeEventListener(
        "animationsfinish",
        prevProps.onAnimationsFinish as EventListener,
      );
    if (this.props.onAnimationsFinish)
      this.el.addEventListener(
        "animationsfinish",
        this.props.onAnimationsFinish as EventListener,
      );
  }

  override componentDidMount() {
    this.updateProperties();
    if (isReact19 && this.el) {
      this.el.digits = this.props.digits;
      this.el.data = this.props.data;
    }
  }

  override getSnapshotBeforeUpdate(prevProps: Readonly<FlowImplProps>) {
    this.updateProperties(prevProps);
    if (prevProps.data !== this.props.data) {
      if (this.props.group) {
        this.props.group.willUpdate();
        return () => this.props.group?.didUpdate();
      }
      if (!this.props.isolate) {
        this.el?.willUpdate();
        return () => this.el?.didUpdate();
      }
    }
    return null;
  }

  override componentDidUpdate(
    _: Readonly<FlowImplProps>,
    __: FlowImplState,
    didUpdate: FlowImplSnapshot,
  ) {
    didUpdate?.();
  }

  private el?: FlowElement;

  handleRef(el: FlowElement) {
    if (this.props.innerRef) this.props.innerRef.current = el;
    this.el = el;
  }

  override render() {
    const [
      _,
      {
        innerRef,
        className,
        data,
        nonce,
        willChange,
        isolate,
        group,
        digits,
        onAnimationsStart,
        onAnimationsFinish,
        ...rest
      },
    ] = splitProps(this.props);

    return (
      // @ts-expect-error missing custom-element types
      <flow-react
        ref={this.handleRef}
        data-will-change={willChange ? "" : undefined}
        class={className}
        nonce={nonce}
        {...rest}
        dangerouslySetInnerHTML={{
          __html: BROWSER
            ? ""
            : renderInnerHTML(data, { nonce, elementSuffix: "-react" }),
        }}
        suppressHydrationWarning
        digits={serialize(digits)}
        data={serialize(data)}
      />
    );
  }
}

export type FlowProps = BaseProps & {
  value: Value;
  locales?: Intl.LocalesArgument;
  format?: Format;
  prefix?: string;
  suffix?: string;
};

const Flow = React.forwardRef<FlowElement, FlowProps>(
  function Flow({ value, locales, format, prefix, suffix, ...props }, _ref) {
    React.useImperativeHandle(_ref, () => ref.current!, []);
    const ref = React.useRef<FlowElement | undefined>(undefined);
    const group = React.useContext(FlowGroupContext);
    group?.useRegister(ref);

    const localesString = React.useMemo(
      () => (locales ? JSON.stringify(locales) : ""),
      [locales],
    );
    const formatString = React.useMemo(
      () => (format ? JSON.stringify(format) : ""),
      [format],
    );
    const data = React.useMemo(() => {
      const formatter = (formatters[`${localesString}:${formatString}`] ??=
        new Intl.NumberFormat(locales, format));
      return formatToData(value, formatter, prefix, suffix);
    }, [value, localesString, formatString, prefix, suffix]);

    return (
      <FlowImpl {...props} group={group} data={data} innerRef={ref} />
    );
  },
);

export default Flow;
export { Flow };

// FlowGroup — keeps several Flows animating in lockstep.

type GroupContext = {
  useRegister: (
    ref: React.MutableRefObject<FlowElement | undefined>,
  ) => void;
  willUpdate: () => void;
  didUpdate: () => void;
};

const FlowGroupContext = React.createContext<GroupContext | undefined>(
  undefined,
);

export function FlowGroup({ children }: { children: React.ReactNode }) {
  const flows = React.useRef(
    new Set<React.MutableRefObject<FlowElement | undefined>>(),
  );
  const updating = React.useRef(false);
  const pending = React.useRef(new WeakMap<FlowElement, boolean>());
  const value = React.useMemo<GroupContext>(
    () => ({
      useRegister(ref) {
        React.useEffect(() => {
          flows.current.add(ref);
          return () => {
            flows.current.delete(ref);
          };
        }, []);
      },
      willUpdate() {
        if (updating.current) return;
        updating.current = true;
        flows.current.forEach((ref) => {
          const f = ref.current;
          if (!f || !f.created) return;
          f.willUpdate();
          pending.current.set(f, true);
        });
      },
      didUpdate() {
        flows.current.forEach((ref) => {
          const f = ref.current;
          if (!f || !pending.current.get(f)) return;
          f.didUpdate();
          pending.current.delete(f);
        });
        updating.current = false;
      },
    }),
    [],
  );

  return (
    <FlowGroupContext.Provider value={value}>
      {children}
    </FlowGroupContext.Provider>
  );
}
