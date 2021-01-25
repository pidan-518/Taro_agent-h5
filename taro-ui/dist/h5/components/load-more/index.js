import Taro from "@tarojs/taro-h5";
import Nerv from "nervjs";
import classNames from 'classnames';
import PropTypes from 'prop-types';
import { Text, View } from '@tarojs/components';
import AtComponent from '../../common/component';
import AtActivityIndicator from '../activity-indicator/index';
import AtButton from '../button/index';
export default class AtLoadMore extends AtComponent {
  onClick() {
    this.props.onClick && this.props.onClick(arguments);
  }
  render() {
    const { className, customStyle, loadingText, moreText, status, moreBtnStyle, noMoreTextStyle, noMoreText } = this.props;
    let component = null;
    if (status === 'loading') {
      component = <AtActivityIndicator mode="center" content={loadingText} />;
    } else if (status === 'more') {
      component = <View className="at-load-more__cnt">
          <AtButton full onClick={this.onClick.bind(this)} customStyle={moreBtnStyle}>
            {moreText}
          </AtButton>
        </View>;
    } else {
      component = <Text className="at-load-more__tip" style={noMoreTextStyle}>
          {noMoreText}
        </Text>;
    }
    return <View className={classNames('at-load-more', className)} style={customStyle}>
        {component}
      </View>;
  }
}
AtLoadMore.defaultProps = {
  customStyle: '',
  className: '',
  noMoreTextStyle: '',
  moreBtnStyle: '',
  status: 'more',
  loadingText: '加载中',
  moreText: '查看更多',
  noMoreText: '没有更多',
  onClick: () => {}
};
AtLoadMore.propTypes = {
  customStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  className: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
  noMoreTextStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  moreBtnStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  status: PropTypes.oneOf(['more', 'loading', 'noMore']),
  loadingText: PropTypes.string,
  moreText: PropTypes.string,
  noMoreText: PropTypes.string,
  onClick: PropTypes.func
};