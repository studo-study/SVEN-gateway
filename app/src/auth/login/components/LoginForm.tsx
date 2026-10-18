import {Form} from "radix-ui";
import {ArrowRight} from "lucide-react";
import {useState} from "react";
import {useNavigate} from "react-router";
import {MatrixLoader} from "~/components/design_system/loader/Loader";
import {AuthError, useLogin} from "~/auth/auth";

const LoginForm: React.FC = () => {
    const navigate = useNavigate();
    const login = useLogin();
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const data = new FormData(e.currentTarget);
        const email = data.get("email") as string;
        const password = data.get("password") as string;

        login.mutate(
            {email, password},
            {
                onSuccess: () => navigate("/"),
                onError: (err) => {
                    if (err instanceof AuthError && err.status === 403) {
                        setError("Only admins can log in");
                    } else {
                        setError("Invalid email or password");
                    }
                },
            },
        );
    };

    return (<Form.Root onSubmit={handleSubmit} className={"border border-neutral-200 p-4 w-fit rounded-2xl bg-neutral-50 "}>
        <Form.Field name={"label"}>
            <div className={"min-w-0 h-fit mb-3 flex-1 flex items-center justify-center"}>
                <h1 className={"text-lg font-georgia font-medium"}><span
                    className={"text-blue-500"}>Sven</span> gateway</h1>
            </div>
        </Form.Field>
        <Form.Field className="mb-3" name="email">
            <div>
                <Form.Label className="text-neutral-500 px-3 text-xs">email <span className={"text-rose-500"}>*</span></Form.Label>
                <Form.Message className="FormMessage" match="valueMissing">
                    Please enter your email
                </Form.Message>
                <Form.Message className="text-rose-500" match="typeMismatch">
                    Please provide a valid email
                </Form.Message>
            </div>
            <Form.Control asChild>
                <div
                    className={"px-3 py-1.5 focus-within:ring-2 ring-black rounded-full border border-neutral-200 bg-white"}>
                    <input className="bg-transparent border-none outline-none ring-none text-sm" type="email"
                           name="email" placeholder={"enter email..."} required/>
                </div>
            </Form.Control>
        </Form.Field>
        <Form.Field name={"password"} className={"mb-8"}>
            <div>
                <Form.Label className="text-neutral-500 px-3 text-xs">password <span className={"text-rose-500"}>*</span></Form.Label>
                <Form.Message className="FormMessage" match="valueMissing">
                    Please enter your email
                </Form.Message>
                <Form.Message className="text-rose-500" match="typeMismatch">
                    Please provide a valid email
                </Form.Message>
            </div>
            <Form.Control asChild>
                <div
                    className={"px-3 py-1.5 focus-within:ring-2 ring-black rounded-full border border-neutral-200 bg-white"}>
                    <input className="bg-transparent border-none outline-none ring-none text-sm" type="password"
                           name="password" placeholder={"enter password..."} required/>
                </div>
            </Form.Control>
        </Form.Field>
        {error && <p className={"text-rose-500 text-xs px-3 mb-3"}>{error}</p>}
        <Form.Submit asChild>
            <button disabled={login.isPending}
                    className="bg-blue-500 flex items-center justify-center gap-2 rounded-full min-w-0 w-full h-10 px-3 py-1.5 text-white font-semibold text-sm disabled:opacity-60">
                {login.isPending ?
                    <>
                        <MatrixLoader variant={"scan"} rounded={true}/>
                        Logging in...
                    </>
                    :
                    <>
                        Login
                        <ArrowRight size={15}/>
                    </>}

            </button>
        </Form.Submit>


    </Form.Root>)
}

LoginForm.displayName = "LoginForm"
export default LoginForm;