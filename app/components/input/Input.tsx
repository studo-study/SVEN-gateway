interface IInputProps {
    value: string;
    type?: "email" | "text" | "password"
    onChange: (input: string) => void;
    placeholder?: string;
    name?: string;
    required?: boolean;
}
const Input: React.FC<IInputProps> = (props) => {
    const {value, onChange, placeholder, name, required, type = "text"} = props;
    return (<div
        className={"px-3 py-1.5 focus-within:ring-2 ring-black rounded-full border border-neutral-200 bg-white"}>
        <input
            value={value}
            onChange={(input) => onChange(input.target.value)}
            className="bg-transparent border-none outline-none ring-none text-sm w-full flex-1"
            type={type}
               name={name} placeholder={placeholder} required={required}/>
    </div>)
}

Input.displayName = "Input";
export default Input;