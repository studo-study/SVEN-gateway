interface IInputProps {
    value: string;
    label?: string;
    type?: "email" | "text" | "password"
    onChange: (input: string) => void;
    placeholder?: string;
    name?: string;
    required?: boolean;
}

const Input: React.FC<IInputProps> = (props) => {
    const {value, onChange, placeholder, name, required, type = "text", label} = props;
    return (
        <div className={"flex flex-col"}>
            {label && <span className={"flex text-xs pl-3 text-neutral-400 mb-1"}>{label}</span>}
            <div
                className={"px-3 py-1.5 focus-within:ring-2 h-10 ring-black rounded-full border border-neutral-200 bg-white"}>
                <input
                    value={value}
                    onChange={(input) => onChange(input.target.value)}
                    className="bg-transparent border-none outline-none ring-none text-sm w-full flex-1"
                    type={type}
                    name={name} placeholder={placeholder} required={required}/>
            </div>
        </div>)
}

Input.displayName = "Input";
export default Input;