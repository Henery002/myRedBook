import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Image, Text } from '@tarojs/components'
import { AtNavBar, AtButton, AtForm, AtInput, AtCheckbox } from 'taro-ui'
import styles from './details.less'

const checkboxOptions = [{
  label: '',
  value: 'pro',
  desc: '',
}];

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

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
        duration: 1000,
        success: () => {
          // Taro.switchTab({ url: '/pages/index/index' });
          Taro.navigateTo({
            url: '/pages/index/index'
          })
        }
      })
    } catch (error) {
      Taro.showToast({ title: '登录失败', icon: 'none' })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (v, e?) => {
    switch (e?.mpEvent?.target?.id) {
      case 'name':
        setPhone(v);
        break;
      case 'password':
        setPassword(v);
      default:
        break;
    }
    console.log(v, e, 'value...')
    return v;
  }

  return (
    <View className={styles.loginContainer}>
      <AtNavBar
        onClickLeftIcon={() => Taro.navigateBack()}
        leftIconType='chevron-left'
        color='#333'
        title='登录'
      />
      <View className={styles.content}>
        <Image
          className={styles.loginImage}
          src={require('@/assets/images/logo.png')}
          mode="aspectFit"
        />

        <AtForm
          className={styles.loginForm}
          onSubmit={handleWechatLogin}
        >
          <AtInput
            name="name"
            type="phone"
            value={phone}
            title="+86"
            cursor={-1}
            placeholder="输入手机号"
            onChange={handleChange}
          />
          <AtInput
            name="password"
            type="password"
            value={password}
            title="密码"
            cursor={-1}
            placeholder="输入密码"
            onChange={handleChange}
          />
          <AtButton
            formType="submit"
            type='primary'
            loading={loading}
          >
            登录
          </AtButton>
          <View className={styles.agreement}>
            <AtCheckbox
              options={checkboxOptions}
              selectedList={[]}
              onChange={handleChange}
            />
            <Text>我已阅读并同意</Text>
            <Text className={styles.link}>《用户协议》</Text>
            <Text className={styles.link}>《隐私政策》</Text>
          </View>
        </AtForm>
      </View>
    </View >
  )
}