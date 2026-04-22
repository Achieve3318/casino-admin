import {
  Button,
  Form,
  Input,
  Modal,
  notification,
  Select
} from "antd";
import { USER_ROLE } from "../constants";
import { useAuth } from "../context/AuthContext";
import { postUrl } from "../utility";

export default function AddUserModal({
  open = false,
  onClose = (f) => f,
  setRefresh = (f) => f,
}) {
  const { logout, sitemode } = useAuth();
  const [form] = Form.useForm();
  const handleSubmit = (values) => {
    postUrl(sitemode,
      "/api/user/create",
      values,
      (data) => {
        if (data?.message !== "success") return;
        notification.success({
          message: "Success",
          description: "Operation Successfully proceed",
        });
        setRefresh();
        onClose();
      },
      logout,
    );
  };

  return (
    <Modal
      title="Add User Role"
      centered
      open={open}
      footer={null}
      onCancel={onClose}
      destroyOnClose={true}
    >
      <Form
        form={form}
        onFinish={handleSubmit}
        layout="vertical"
        initialValues={{
          role: USER_ROLE.COMMON, // default role
        }}
      >
        <Form.Item
          label="Display Name"
          name="displayName"
          rules={[{ required: true, message: "Please enter display name" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Family Name" name={["name", "familyName"]}>
          <Input />
        </Form.Item>

        <Form.Item label="Given Name" name={["name", "givenName"]}>
          <Input />
        </Form.Item>

        <Form.Item
          label="Email"
          name="email"
          rules={[
            {
              type: "email",
              message: "Please enter a valid email address",
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true, message: "Please enter username" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: "Please enter password" }]}
        >
          <Input.Password />
        </Form.Item>
        {/* <Form.Item
                label="Confirm Password"
                name="confirmPassword"
                dependencies={['password']}
                hasFeedback
                rules={[
                    { required: true, message: 'Please confirm your password' },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('password') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject('The two passwords that you entered do not match!');
                        },
                    }),
                ]}
            >
                <Input.Password />
            </Form.Item> */}

        <Form.Item
          label="Role"
          name="role"
          rules={[{ required: true, message: "Please select a role" }]}
        >
          <Select>
            {Object.values(USER_ROLE).map((role) => (
              <Select.Option key={role} value={role}>
                {role}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Add User
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
