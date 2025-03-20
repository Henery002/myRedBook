import { View } from "@tarojs/components";
import { AtSearchBar, AtTabs, AtTabsPane } from "taro-ui";

import styles from './details.less'

export default function ListPage() {
	return (
		<View className={styles.listPagePage}>
			<AtSearchBar
				value=""
				placeholder="搜索你感兴趣的内容"
				onChange={() => null}
			/>
			<AtTabs
				scroll
				current={0}
				tabList={
					[
						{ title: '推荐' },
						{ title: '旅行' },
						{ title: '美食' },
						{ title: '摄影' },
						{ title: '户外' },
						{ title: '穿搭' },
						{ title: '家居' },
						{ title: '职场' },
						{ title: '音乐' }
					]}
				onClick={() => null}
			>
				{
					[1, 2, 3].map(v => <AtTabsPane current={0} index={0}><View>11</View></AtTabsPane>)
				}
			</AtTabs>
		</View>
	)
}