import { Button, Form, Input, theme } from "antd";
import axios from "axios";
import React from "react";
import { Link } from "react-router-dom";
import { error, success } from "../../utility/notification";

const { useToken } = theme;

const Register = () => {
  const { token } = useToken();

  const onFinish = (values) => {
    axios
      .post(`${process.env.SUB_SITE[sitemode]}/api/auth/signup`, values)
      .then((res) => {
        success("Your registration has been successful.");
      })
      .catch((err) => {
        error(err);
      });
    // Add logic to handle registration, such as an API call.
  };

  const onFinishFailed = (errorInfo) => {};

  return (
    <div className="flex items-center justify-center h-screen ">
      <div
        className="w-96 p-6 rounded-lg shadow-md"
        style={{ background: token.colorFillSecondary }}
      >
        <h2 className="text-2xl font-bold text-center mb-4 /70">Register</h2>
        <Form
          name="registerForm"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          className="space-y-4"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please input your Username!" }]}
          >
            <Input
              placeholder="Username"
              className="py-2 px-4 border rounded-md w-full"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please input your Email!" },
              { type: "email", message: "The input is not a valid email!" },
            ]}
          >
            <Input
              placeholder="Email"
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

          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your Password!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("The two passwords do not match!"),
                  );
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="Confirm Password"
              className="py-2 px-4 border rounded-md w-full"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full bg-blue-500  py-2 rounded-md hover:bg-blue-600"
            >
              Register
            </Button>
          </Form.Item>
          <Form.Item className="flex justify-end">
            <Link to="/login">
              <span className="text-blue-500 underline">To login</span>
            </Link>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Register;
