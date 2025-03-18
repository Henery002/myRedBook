import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import { AtNavBar, AtButton } from 'taro-ui'
import styles from './login.less'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  // 处理微信登录
  const handleWechatLogin = async () => {
    setLoading(true)
    try {
      const { code } = await Taro.login()
      // 这里应调用后端接口进行登录验证
      console.log('微信登录code:', code)

      // 模拟登录成功
      Taro.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          Taro.switchTab({ url: '/pages/home/index' })
        }
      })
    } catch (error) {
      Taro.showToast({ title: '登录失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  // 其他登录方式
  const handleOtherLogin = () => {
    Taro.navigateTo({ url: '/pages/other-login/index' })
  }

  // 用户协议点击
  const handleAgreementClick = (type: 'user' | 'privacy') => {
    Taro.navigateTo({
      url: `/pages/webview/index?url=${encodeURIComponent(
        type === 'user'
          ? 'https://www.xiaohongshu.com/user_agreement'
          : 'https://www.xiaohongshu.com/privacy_policy'
      )}`
    })
  }

  return (
    <View className={styles.loginContainer}>
      <AtNavBar
        // onClickLeftIcon={() => Taro.navigateBack()}
        onClickLeftIcon={() => Taro.navigateBack()}
        color='#333'
        leftIconType='chevron-left'
        title='登录'
        leftText='返回'
      />

      <View className={styles.content}>
        <Image
          className={styles.loginImage}
          src={require('@/assets/images/logo.jpeg')}
          mode="aspectFit"
        />
        <View className={styles.title}>发现你的生活</View>

        <View className={styles.buttonGroup}>
          <AtButton
            type='primary'
            className={styles.wechatBtn}
            loading={loading}
            onClick={handleWechatLogin}
          >
            登录
          </AtButton>
        </View>

        <View className={styles.agreement}>
          登录即表示同意
          <Text className={styles.link} onClick={() => handleAgreementClick('user')}>《用户协议》</Text>
          和
          <Text className={styles.link} onClick={() => handleAgreementClick('privacy')}>《隐私政策》</Text>
        </View>
      </View>
    </View>
  )
}