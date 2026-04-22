import { Button, Form, Input, Spin, theme } from "antd";
import axios from "axios";
import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { error , success} from "../../utility/notification";

const LOGIN_STEPS = {
  LOGIN_FORM: 0,
  VERIFY: 1,
};

const { useToken } = theme;

const InputForm = ({ onFinish = (f) => f, onFinishFailed = (f) => f }) => (
  <Form
    name="loginForm"
    initialValues={{ remember: false }}
    onFinish={onFinish}
    onFinishFailed={onFinishFailed}
    className="space-y-4"
  >
    <Form.Item
      name="username"
      rules={[{ required: true, message: "Please input your Username!" }]}
    >
      <Input
        placeholder="Username "
        className="py-2 px-4 border rounded-md w-full"
      />
    </Form.Item>

    <Form.Item
      name="password"
      rules={[{ required: true, message: "Please input your Password!" }]}
    >
      <Input.Password
        placeholder="Password"
        className="py-2 px-4 border rounded-md w-full"
      />
    </Form.Item>

    <Form.Item>
      <Button
        type="primary"
        htmlType="submit"
        className="w-full bg-blue-500  py-2 rounded-md hover:bg-blue-600"
      >
        Log in
      </Button>
    </Form.Item>
    {/* <Form.Item className="flex justify-end">
            <Link to="/register">
              <span className="text-blue-500 underline">Create new account</span>
            </Link>
          </Form.Item> */}
  </Form>
);

const VerifyForm = ({ onFinish = (f) => f, onFinishFailed = (f) => f }) => {
  const [form] = Form.useForm(); // Using Form instance to trigger form submission

  const handleOTPChange = (value) => {
    // Check if OTP length is reached
    if (value.length === 6) {
      form.submit(); // Automatically submit the form when OTP is fully entered
    }
  };

  return (
    <Form
      form={form}
      name="verifyForm"
      initialValues={{ remember: false }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      className="space-y-4"
    >
      <Form.Item
        name="code"
        rules={[{ required: true, message: "Please enter your Code!" }]}
      >
        <Input.OTP
          length={6}
          onChange={handleOTPChange} // Trigger submission on change
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          className="w-full bg-blue-500 py-2 rounded-md hover:bg-blue-600"
        >
          Verify Code
        </Button>
      </Form.Item>
    </Form>
  );
};

const Login = () => {
  const { setAuth, auth, logout , sitemode } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(LOGIN_STEPS.LOGIN_FORM);
  const { token } = useToken();
  const [username, setUsername] = useState("");
  const onFinish = (values) => {
    if (loading === true) return;
    setLoading(true);
    axios
      .post(`${process.env.REACT_APP_PROVIDER_URL}/api/auth/signin`, values)
      .then((res) => {
        if (res.data.message === "verify2fa") {
          if(res.data.result){
            success("The code was sent to super admin. Contact him and input the code.");
          }
          else{
            error("Failed to login. Please contact to super admin.");
          }
          setUsername(res.data.user.username);
          setStep(LOGIN_STEPS.VERIFY);
        } else if (res.data.token) {
          localStorage.setItem("token", res.data.token);
          setAuth({
            isAuthenticated: true,
            user: res.data.user,
          });
          axios.defaults.headers.common["Authorization"] =
            `Bearer ${res.data.token}`;
        }
        setLoading(false);
      })
      .catch((err) => {
        if ((err.response || {}).status === 401) logout();
        else error(err);
        setLoading(false);
      });
  };

  const onVerify = (values) => {
    axios
      .post(`${process.env.REACT_APP_PROVIDER_URL}/api/auth/verify2fa`, {
        ...values,
        username,
      })
      .then((res) => {
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
          setAuth({
            isAuthenticated: true,
            user: res.data.user,
          });
          axios.defaults.headers.common["Authorization"] =
            `Bearer ${res.data.token}`;
        }
      })
      .catch((err) => {
        if ((err.response || {}).status === 401) logout();
        else error(err);
      });
  };

  if (auth.isAuthenticated) {
    return <Navigate to="/statistic" replace />;
  }

  const onFinishFailed = (errorInfo) => { };

  return (
    <div className="flex items-center justify-center h-screen">
      <div
        className="w-80 p-6 rounded-lg shadow-lg border-solid border"
        style={{ background: token.colorBgBase }}
      >
        <h2 className="text-2xl font-bold text-center mb-4 /70">Login</h2>
        {loading ? (
          <div className="flex justify-center items-center w-full h-24">
            <Spin />
          </div>
        ) : (
          <>
            {step === LOGIN_STEPS.LOGIN_FORM ? (
              <InputForm onFinish={onFinish} onFinishFailed={onFinishFailed} />
            ) : (
              <VerifyForm onFinish={onVerify} onFinishFailed={onFinishFailed} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
