import { View } from '@tarojs/components'
import { AtTabBar } from 'taro-ui'

import styles from './details.less'

const tabList = [
	{
		title: '首页',
		iconType: '',
	},
	{
		title: '',
		iconType: 'add',
	},
	{
		title: '我的',
		iconType: '',
	}
]

export default function TabBar() {
	const toggleTab = (v) => {
		console.log(v, 'v...')
	}

	return (
		<View className={styles.indexPage}>
			<AtTabBar
				fixed
				color="#666"
				selectedColor="#333"
				tabList={tabList}
				current={0}
				fontSize={16}
				onClick={toggleTab}
			/>
		</View>
	)
}