import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { FormData2 } from "../../../app/auth/RegisterScreen";
import tw from "twrnc";

interface Form2Props {
  onChange: (field: keyof FormData2, value: string) => void;
  setConfirmPassword: (value: string) => void;
  profile: "MENTOR" | "MENTORADO" | "COORDENADOR";
}

const Form2: React.FC<Form2Props> = ({ onChange, setConfirmPassword, profile }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPass] = useState("");

  const schoolOptions = [
    { title: "Caxito", value: "CAXITO" },
    { title: "Malanje", value: "MALANJE" },
    { title: "Ndalatando", value: "NDALATANDO" },
    { title: "Ondjiva", value: "ONDJIVA" }
  ];

  const gradeOptions = [
    { title: "10ª Classe", value: "10" },
    { title: "11ª Classe", value: "11" },
    { title: "12ª Classe", value: "12" }
  ];

  const handleGenerationYear = () => {
    var years: number[] = [];
    const minYearBefore = 3;
    const maxYearBefore = 10;
    const currentYear = new Date().getFullYear();
    
    for (let i = minYearBefore; i < maxYearBefore; i++) {
      const year = currentYear - i;
      years.push(year);
    }

    return years;
  };

  return (
    <View style={tw`bg-transparent m-0 p-0 w-full flex  justify-start items-center`}>
      <select
        required
        style={tw`w-full py-4 px-5 mb-5 bg-[#F5F5F5] text-[#A5A3B1] rounded-full border-0`}
        onChange={(event) => {
          onChange("school", event.target.value);
        }}

      >
        <option value="" disabled selected hidden>
          {profile === "MENTORADO" ? "Selecione o Liceu" : "Selecione o Liceu que frequentou*"}

        </option>
        {schoolOptions.map((option, index) => (
          <option key={index} value={option.value}>
            {option.title}
          </option>
        ))}
      </select>

      {profile === "MENTORADO" ?
        <select
          required={profile === "MENTORADO"}
          style={tw`w-full py-4 px-5 mb-5 bg-[#F5F5F5] text-[#A5A3B1] rounded-full border-0`}
          onChange={(event) => {
            onChange("grade", event.target.value);
          }}
        >
          {gradeOptions.map((option, index) => (
            <option key={index} value={option.value}>
              {option.title}
            </option>
          ))}
        </select>
        :
        <select        
          style={tw`w-full py-4 px-5 mb-5 bg-[#F5F5F5] text-[#A5A3B1] rounded-full border-0`}
          onChange={(event) => {
            onChange("schoolYear", event.target.value);
          }}
        >
          <option value="" disabled selected hidden>
            Informe a sua geração ou ano de conlusão*
          </option>
          {handleGenerationYear().map((year, index) => (
            <option key={index} value={year}>
              {year}
            </option>
          ))}
        </select>
      }

      {profile !== "MENTORADO" && (
        <input
          type="number"
          style={tw`w-full py-4 px-5 mb-5 bg-[#F5F5F5] text-[#A5A3B1] rounded-full border-0`}
          min={0}
          placeholder="Qual é o seu número máximo de mentorados*"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            onChange("maxMenteeNumber", event.target.value);
          }}
        />
      )}

      <input
        type="password"
        style={tw`w-full py-4 px-5 mb-5 bg-[#F5F5F5] text-[#A5A3B1] rounded-full border-0`}
        placeholder="Senha"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          onChange("password", event.target.value);
        }}
      />

      <input
        type="password"
        style={tw`w-full py-4 px-5 mb-5 bg-[#F5F5F5] text-[#A5A3B1] rounded-full border-0`}
        placeholder="Confirmar a senha"
        value={confirmPassword}
        onChange={(event) => {
          setConfirmPass(event.target.value);
          setConfirmPassword(event.target.value);
        }}
      />
    </View>
  );
};

export default Form2;

