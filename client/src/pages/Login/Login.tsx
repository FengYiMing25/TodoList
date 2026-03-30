import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Checkbox, Form, Input, Spin, message } from 'antd';
import { Mail, KeyRound, Eye, EyeOff, LogIn, UserPlus, User } from 'lucide-react';
import { useIsMobile } from '@hooks/useIsMobile';
import { useAuthStore } from '@stores/authStore';
import { useSettingsStore } from '@stores/settingsStore';
import styles from './Login.module.less';

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

const Pupil: React.FC<PupilProps> = ({
  size = 12,
  maxDistance = 5,
  pupilColor = "black",
  forceLookX,
  forceLookY
}) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const pupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const calculatePupilPosition = () => {
    if (!pupilRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const pupil = pupilRef.current.getBoundingClientRect();
    const pupilCenterX = pupil.left + pupil.width / 2;
    const pupilCenterY = pupil.top + pupil.height / 2;

    const deltaX = mouseX - pupilCenterX;
    const deltaY = mouseY - pupilCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={pupilRef}
      className={styles.pupil}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
      }}
    />
  );
};

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

const EyeBall: React.FC<EyeBallProps> = ({
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  forceLookX,
  forceLookY
}) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const eyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const calculatePupilPosition = () => {
    if (!eyeRef.current) return { x: 0, y: 0 };

    if (forceLookX !== undefined && forceLookY !== undefined) {
      return { x: forceLookX, y: forceLookY };
    }

    const eye = eyeRef.current.getBoundingClientRect();
    const eyeCenterX = eye.left + eye.width / 2;
    const eyeCenterY = eye.top + eye.height / 2;

    const deltaX = mouseX - eyeCenterX;
    const deltaY = mouseY - eyeCenterY;
    const distance = Math.min(Math.sqrt(deltaX ** 2 + deltaY ** 2), maxDistance);

    const angle = Math.atan2(deltaY, deltaX);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    return { x, y };
  };

  const pupilPosition = calculatePupilPosition();

  return (
    <div
      ref={eyeRef}
      className={styles.eyeBall}
      style={{
        width: `${size}px`,
        height: isBlinking ? '2px' : `${size}px`,
        backgroundColor: eyeColor,
      }}
    >
      {!isBlinking && (
        <div
          className={styles.eyeBallPupil}
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
          }}
        />
      )}
    </div>
  );
};

interface AnimatedCharactersProps {
  isTyping?: boolean;
  showPassword?: boolean;
  passwordLength?: number;
}

const AnimatedCharacters: React.FC<AnimatedCharactersProps> = ({
  isTyping = false,
  showPassword = false,
  passwordLength = 0,
}) => {
  const [mouseX, setMouseX] = useState<number>(0);
  const [mouseY, setMouseY] = useState<number>(0);
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;

    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => {
          setIsPurpleBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());

      return blinkTimeout;
    };

    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000;

    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => {
          setIsBlackBlinking(false);
          scheduleBlink();
        }, 150);
      }, getRandomBlinkInterval());

      return blinkTimeout;
    };

    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (isTyping) {
      setIsLookingAtEachOther(true);
      const timer = setTimeout(() => {
        setIsLookingAtEachOther(false);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setIsLookingAtEachOther(false);
    }
  }, [isTyping]);

  useEffect(() => {
    if (passwordLength > 0 && showPassword) {
      const schedulePeek = () => {
        const peekInterval = setTimeout(() => {
          setIsPurplePeeking(true);
          setTimeout(() => {
            setIsPurplePeeking(false);
          }, 800);
        }, Math.random() * 3000 + 2000);
        return peekInterval;
      };

      const firstPeek = schedulePeek();
      return () => clearTimeout(firstPeek);
    } else {
      setIsPurplePeeking(false);
    }
  }, [passwordLength, showPassword, isPurplePeeking]);

  const calculatePosition = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 3;

    const deltaX = mouseX - centerX;
    const deltaY = mouseY - centerY;

    const faceX = Math.max(-15, Math.min(15, deltaX / 20));
    const faceY = Math.max(-10, Math.min(10, deltaY / 30));
    const bodySkew = Math.max(-6, Math.min(6, -deltaX / 120));

    return { faceX, faceY, bodySkew };
  };

  const purplePos = calculatePosition(purpleRef);
  const blackPos = calculatePosition(blackRef);
  const yellowPos = calculatePosition(yellowRef);
  const orangePos = calculatePosition(orangeRef);

  const isHidingPassword = passwordLength > 0 && !showPassword;

  return (
    <div className={styles.charactersWrapper}>
      <div className={styles.charactersContainer}>
        <div
          ref={purpleRef}
          className={`${styles.character} ${styles.purple}`}
          style={{
            transform: (passwordLength > 0 && showPassword)
              ? `skewX(0deg)`
              : (isTyping || isHidingPassword)
                ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(50px)`
                : `skewX(${purplePos.bodySkew || 0}deg)`,
          }}
        >
          <div
            className={styles.eyes}
            style={{
              left: (passwordLength > 0 && showPassword) ? `25px` : isLookingAtEachOther ? `65px` : `${55 + purplePos.faceX}px`,
              top: (passwordLength > 0 && showPassword) ? `45px` : isLookingAtEachOther ? `80px` : `${50 + purplePos.faceY}px`,
            }}
          >
            <EyeBall
              size={22}
              pupilSize={9}
              maxDistance={6}
              eyeColor="white"
              pupilColor="#2D2D2D"
              isBlinking={isPurpleBlinking}
              forceLookX={(passwordLength > 0 && showPassword) ? (isPurplePeeking ? 5 : -5) : isLookingAtEachOther ? 4 : undefined}
              forceLookY={(passwordLength > 0 && showPassword) ? (isPurplePeeking ? 6 : -5) : isLookingAtEachOther ? 5 : undefined}
            />
            <EyeBall
              size={22}
              pupilSize={9}
              maxDistance={6}
              eyeColor="white"
              pupilColor="#2D2D2D"
              isBlinking={isPurpleBlinking}
              forceLookX={(passwordLength > 0 && showPassword) ? (isPurplePeeking ? 5 : -5) : isLookingAtEachOther ? 4 : undefined}
              forceLookY={(passwordLength > 0 && showPassword) ? (isPurplePeeking ? 6 : -5) : isLookingAtEachOther ? 5 : undefined}
            />
          </div>
        </div>

        <div
          ref={blackRef}
          className={`${styles.character} ${styles.black}`}
          style={{
            transform: (passwordLength > 0 && showPassword)
              ? `skewX(0deg)`
              : isLookingAtEachOther
                ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(25px)`
                : (isTyping || isHidingPassword)
                  ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
                  : `skewX(${blackPos.bodySkew || 0}deg)`,
          }}
        >
          <div
            className={styles.eyes}
            style={{
              left: (passwordLength > 0 && showPassword) ? `15px` : isLookingAtEachOther ? `40px` : `${32 + blackPos.faceX}px`,
              top: (passwordLength > 0 && showPassword) ? `35px` : isLookingAtEachOther ? `15px` : `${40 + blackPos.faceY}px`,
            }}
          >
            <EyeBall
              size={20}
              pupilSize={8}
              maxDistance={5}
              eyeColor="white"
              pupilColor="#2D2D2D"
              isBlinking={isBlackBlinking}
              forceLookX={(passwordLength > 0 && showPassword) ? -5 : isLookingAtEachOther ? 0 : undefined}
              forceLookY={(passwordLength > 0 && showPassword) ? -5 : isLookingAtEachOther ? -5 : undefined}
            />
            <EyeBall
              size={20}
              pupilSize={8}
              maxDistance={5}
              eyeColor="white"
              pupilColor="#2D2D2D"
              isBlinking={isBlackBlinking}
              forceLookX={(passwordLength > 0 && showPassword) ? -5 : isLookingAtEachOther ? 0 : undefined}
              forceLookY={(passwordLength > 0 && showPassword) ? -5 : isLookingAtEachOther ? -5 : undefined}
            />
          </div>
        </div>

        <div
          ref={orangeRef}
          className={`${styles.character} ${styles.orange}`}
          style={{
            transform: (passwordLength > 0 && showPassword) ? `skewX(0deg)` : `skewX(${orangePos.bodySkew || 0}deg)`,
          }}
        >
          <div
            className={styles.pupilEyes}
            style={{
              left: (passwordLength > 0 && showPassword) ? `60px` : `${100 + (orangePos.faceX || 0)}px`,
              top: (passwordLength > 0 && showPassword) ? `110px` : `${115 + (orangePos.faceY || 0)}px`,
            }}
          >
            <Pupil size={15} maxDistance={6} pupilColor="#2D2D2D" forceLookX={(passwordLength > 0 && showPassword) ? -6 : undefined} forceLookY={(passwordLength > 0 && showPassword) ? -5 : undefined} />
            <Pupil size={15} maxDistance={6} pupilColor="#2D2D2D" forceLookX={(passwordLength > 0 && showPassword) ? -6 : undefined} forceLookY={(passwordLength > 0 && showPassword) ? -5 : undefined} />
          </div>
        </div>

        <div
          ref={yellowRef}
          className={`${styles.character} ${styles.yellow}`}
          style={{
            transform: (passwordLength > 0 && showPassword) ? `skewX(0deg)` : `skewX(${yellowPos.bodySkew || 0}deg)`,
          }}
        >
          <div
            className={styles.pupilEyes}
            style={{
              left: (passwordLength > 0 && showPassword) ? `25px` : `${65 + (yellowPos.faceX || 0)}px`,
              top: (passwordLength > 0 && showPassword) ? `45px` : `${50 + (yellowPos.faceY || 0)}px`,
            }}
          >
            <Pupil size={15} maxDistance={6} pupilColor="#2D2D2D" forceLookX={(passwordLength > 0 && showPassword) ? -6 : undefined} forceLookY={(passwordLength > 0 && showPassword) ? -5 : undefined} />
            <Pupil size={15} maxDistance={6} pupilColor="#2D2D2D" forceLookX={(passwordLength > 0 && showPassword) ? -6 : undefined} forceLookY={(passwordLength > 0 && showPassword) ? -5 : undefined} />
          </div>
          <div
            className={styles.mouth}
            style={{
              left: (passwordLength > 0 && showPassword) ? `15px` : `${50 + (yellowPos.faceX || 0)}px`,
              top: (passwordLength > 0 && showPassword) ? `110px` : `${110 + (yellowPos.faceY || 0)}px`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

type AuthMode = 'login' | 'register';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { login, register, isLoading } = useAuthStore();
  const { primaryColor } = useSettingsStore();

  const [mode, setMode] = useState<AuthMode>('login');
  const [form] = Form.useForm();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const formContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      const isClickInsideForm = formContainerRef.current?.contains(event.target as Node);
      setIsFocused(!!isClickInsideForm);
    };

    document.addEventListener('mousedown', handleGlobalClick);
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, []);

  const passwordValue = Form.useWatch('password', form);

  const handleModeSwitch = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    form.resetFields();
  };

  const handleLogin = async (values: any) => {
    await login(values.username.trim(), values.password);
    message.success('登录成功');
    navigate('/');
  };

  const handleRegister = async (values: any) => {
    await register(
      values.username.trim(),
      values.email.trim(),
      values.password
    );
    message.success('注册成功');
    navigate('/');
  };

  const handleFinish = async (values: any) => {
    try {
      if (mode === 'login') {
        await handleLogin(values);
      } else {
        await handleRegister(values);
      }
    } catch (error: any) {
      message.error(error.message || (mode === 'login' ? '登录失败' : '注册失败'));
    }
  };

  const leftPanelStyle = { '--primary-color': primaryColor } as React.CSSProperties;

  return (
    <div className={styles.loginPage}>
      {!isMobile && (
        <div className={styles.leftPanel} style={leftPanelStyle}>
          <div className={styles.brandSection}>
            <h2>TodoApp</h2>
          </div>
          <AnimatedCharacters
            isTyping={isFocused}
            showPassword={showPassword}
            passwordLength={passwordValue?.length || 0}
          />
        </div>
      )}

      <div className={styles.rightPanel}>
        <Spin spinning={isLoading} size="large">
          <div className={styles.formContainer} ref={formContainerRef}>
            <div className={styles.formHeader}>
              <h1>{mode === 'login' ? '欢迎回来！' : '创建账户'}</h1>
              <p>{mode === 'login' ? '请输入您的信息' : '注册一个新账户'}</p>
            </div>

            <Form
              form={form}
              onFinish={handleFinish}
              layout="vertical"
            >
              {mode === 'register' && (
                <Form.Item
                  name="username"
                  rules={[
                    { required: true, message: '请输入用户名' },
                    { min: 3, message: '用户名至少3个字符' },
                  ]}
                >
                  <Input size="large" placeholder="用户名" prefix={<User size={18} color="#888" />} />
                </Form.Item>
              )}

              {mode === 'login' && (
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: '请输入用户名或邮箱' }]}
                >
                  <Input size="large" placeholder="用户名或邮箱" prefix={<User size={18} color="#888" />} />
                </Form.Item>
              )}

              {mode === 'register' && (
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' },
                  ]}
                >
                  <Input size="large" placeholder="邮箱地址" prefix={<Mail size={18} color="#888" />} />
                </Form.Item>
              )}

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' },
                ]}
              >
                <Input
                  size="large"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="密码"
                  prefix={<KeyRound size={18} color="#888" />}
                  suffix={
                    <Button
                      type="text"
                      icon={showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  }
                />
              </Form.Item>

              {mode === 'register' && (
                <Form.Item
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '请确认密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'));
                      },
                    }),
                  ]}
                >
                  <Input
                    size="large"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="确认密码"
                    prefix={<KeyRound size={18} color="#888" />}
                  />
                </Form.Item>
              )}

              {mode === 'login' && (
                <Form.Item>
                  <Form.Item name="remember" valuePropName="checked" noStyle>
                    <Checkbox>记住我</Checkbox>
                  </Form.Item>
                  <a className={styles.forgotPassword} href="#">忘记密码？</a>
                </Form.Item>
              )}

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={isLoading}
                  icon={mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
                >
                  {mode === 'login' ? '登录' : '注册'}
                </Button>
              </Form.Item>
            </Form>

            <div className={styles.switchMode}>
              {mode === 'login' ? (
                <>
                  还没有账户？{' '}
                  <a onClick={handleModeSwitch}>立即注册</a>
                </>
              ) : (
                <>
                  已有账户？{' '}
                  <a onClick={handleModeSwitch}>立即登录</a>
                </>
              )}
            </div>
          </div>
        </Spin>
      </div>
    </div>
  );
};

export default Login;
