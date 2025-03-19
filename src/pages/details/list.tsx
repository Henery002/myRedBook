import { View } from "@tarojs/components";
import { AtSearchBar, AtTabs, AtTabsPane } from "taro-ui";

import styles from './details.less'

export default function ListPage() {
	return (
		<View className={styles.listPagePage}>
			<View>
				<AtSearchBar
					value=""
					placeholder="搜索你感兴趣的内容"
					onChange={() => null}
				/>
			</View>
			<View>
				<AtTabs
					scroll
					current={0}
					tabList={
						[
							{ title: '标签页1' },
							{ title: '标签页2' },
							{ title: '标签页3' },
							{ title: '标签页4' },
							{ title: '标签页5' },
							{ title: '标签页6' }
						]}
					onClick={() => null}
				>
					{
						[1, 2, 3].map(v => <AtTabsPane current={1} index={0}><View>11</View></AtTabsPane>)
					}
				</AtTabs>
			</View>
			<View>3</View>
		</View>
	)
}