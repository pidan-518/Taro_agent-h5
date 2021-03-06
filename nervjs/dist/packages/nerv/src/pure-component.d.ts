import Component from './component';
declare class PureComponent<P, S> extends Component<P, S> {
    isPureComponent: boolean;
    shouldComponentUpdate(nextProps: P, nextState: S): boolean;
}
export default PureComponent;
