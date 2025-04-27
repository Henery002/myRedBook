import { useState, useEffect } from "react";
import Taro from "@tarojs/taro";
import { View, Image } from "@tarojs/components";
import { AtNavBar, AtButton, AtForm, AtInput, AtCheckbox } from "taro-ui";

import { useUserStore } from "@/store";

import styles from "./index.less";

interface FormData {
  phone: string;
  password: string;
}

export default function LoginPage() {
  const { login, loading } = useUserStore();
  const [formData, setFormData] = useState<FormData>({
    phone: "18552276781",
    password: "123456",
  });
  const [errors, setErrors] = useState<any>({
    phone: true,
    password: true,
  });
  const [agreeProtocal, setAgreeProtocal] = useState(false);
  const [disabled, setDisabled] = useState<boolean>(true);

  const validaForm = () => {
    const newErrors: any = {};

    newErrors.phone = !/^1[3-9]\d{9}$/.test(formData.phone);

    newErrors.password = formData.password.length < 6;

    setErrors(newErrors);
    return Object.values(newErrors).every((v) => !v);
  };

  const handleInputChange = (value: string, field: keyof FormData) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
    return value;
  };

  const handleProtocalChange = () => {
    setAgreeProtocal((prev) => !prev);
  };

  const handleLogin = async () => {
    if (!agreeProtocal) {
      Taro.showToast({
        title: "请先同意用户协议",
        icon: "none",
      });
      return;
    }

    if (!validaForm()) {
      return;
    }

    try {
      const res = await login(formData);

      if (!!res) {
        // Taro.navigateTo({
        // Taro.reLaunch({
        // url: "/pages/index/index",
        // });
        Taro.navigateBack(); // 登陆成功后回到之前的页面
      }
    } catch (error) {
      console.error(error, "登录失败");
    }
  };

  useEffect(() => {
    setDisabled(!validaForm());
  }, [formData]);

  return (
    <View className={styles.loginContainer}>
      <AtNavBar
        onClickLeftIcon={() => Taro.navigateBack()}
        leftIconType="chevron-left"
        color="#333"
        title="登录"
      />
      <View className={styles.content}>
        <Image
          className={styles.loginImage}
          src={require("@/assets/images/logo_zoom.png")}
          mode="widthFix"
        />

        <AtForm className={styles.loginForm}>
          <AtInput
            title="+86"
            name="phone"
            type="phone"
            value={formData.phone}
            cursor={-1}
            placeholder="输入手机号"
            onChange={(v) => handleInputChange(v as string, "phone")}
          />
          <AtInput
            title="密码"
            name="password"
            type="password"
            value={formData.password}
            cursor={-1}
            placeholder="输入密码"
            onChange={(v) => handleInputChange(v as string, "password")}
          />
          <AtButton
            type="primary"
            loading={loading}
            disabled={disabled}
            onClick={handleLogin}
          >
            登录
          </AtButton>
          <View className={styles.agreement}>
            <AtCheckbox
              options={[
                {
                  label: "我已阅读并同意《用户协议》《隐私政策》",
                  value: "agree",
                },
              ]}
              selectedList={agreeProtocal ? ["agree"] : []}
              onChange={handleProtocalChange}
            />
          </View>
        </AtForm>
      </View>
    </View>
  );
}
